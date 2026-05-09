import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { getAnalytics, AnalyticsData } from '../api/analytics';

const SENT_COLORS: Record<string, string> = {
  favour: '#2f9e44', against: '#e03131', neutral: '#4dabf7',
  floating: '#f59f00', unknown: '#adb5bd',
};

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={b.row}>
      <Text style={b.label}>{label}</Text>
      <View style={b.track}>
        <View style={[b.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={b.val}>{value.toLocaleString()}</Text>
    </View>
  );
}

const b = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 56, fontSize: 12, color: '#495057', fontWeight: '600' },
  track: { flex: 1, height: 10, backgroundColor: '#e9ecef', borderRadius: 5,
    overflow: 'hidden', marginHorizontal: 8 },
  fill: { height: '100%', borderRadius: 5 },
  val: { width: 44, fontSize: 12, color: '#212529', fontWeight: '700', textAlign: 'right' },
});

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setData(await getAnalytics()); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;
  if (!data) return <View style={s.center}><Text>No data available.</Text></View>;

  const totalVoters = data.sentiment.favour + data.sentiment.against +
    data.sentiment.neutral + data.sentiment.floating + data.sentiment.unknown;
  const totalGender = data.gender.male + data.gender.female + data.gender.other;
  const maxAge = Math.max(...data.ageGroups.map(a => a.count), 1);

  const sentimentEntries = [
    { key: 'Favour', val: data.sentiment.favour, color: SENT_COLORS.favour },
    { key: 'Against', val: data.sentiment.against, color: SENT_COLORS.against },
    { key: 'Neutral', val: data.sentiment.neutral, color: SENT_COLORS.neutral },
    { key: 'Floating', val: data.sentiment.floating, color: SENT_COLORS.floating },
    { key: 'Unknown', val: data.sentiment.unknown, color: SENT_COLORS.unknown },
  ];

  return (
    <ScrollView style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={s.header}>
        <Text style={s.title}>Analytics</Text>
        <Text style={s.sub}>{totalVoters.toLocaleString()} total voters</Text>
      </View>

      {/* Sentiment Breakdown */}
      <View style={s.card}>
        <Text style={s.secTitle}>?? Sentiment Breakdown</Text>
        {sentimentEntries.map(({ key, val, color }) => (
          <BarRow key={key} label={key} value={val} max={totalVoters} color={color} />
        ))}
        {/* Pie-like colour row */}
        <View style={s.colorStrip}>
          {sentimentEntries.map(({ key, val, color }) => (
            <View key={key}
              style={[s.stripSeg, {
                flex: val > 0 ? val : 0.01,
                backgroundColor: color,
              }]} />
          ))}
        </View>
        <View style={s.legend}>
          {sentimentEntries.map(({ key, val, color }) => (
            <View key={key} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: color }]} />
              <Text style={s.legendTxt}>{key} ({totalVoters > 0
                ? Math.round((val / totalVoters) * 100) : 0}%)</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Gender Breakdown */}
      <View style={s.card}>
        <Text style={s.secTitle}>?? Gender Breakdown</Text>
        <View style={s.genderRow}>
          {[
            { label: 'Male', val: data.gender.male, color: '#4dabf7', icon: '??' },
            { label: 'Female', val: data.gender.female, color: '#f783ac', icon: '??' },
            { label: 'Other', val: data.gender.other, color: '#adb5bd', icon: '??' },
          ].map(({ label, val, color, icon }) => (
            <View key={label} style={s.genderCard}>
              <Text style={s.genderIcon}>{icon}</Text>
              <Text style={[s.genderVal, { color }]}>{val.toLocaleString()}</Text>
              <Text style={s.genderLbl}>{label}</Text>
              <Text style={s.genderPct}>
                {totalGender > 0 ? Math.round((val / totalGender) * 100) : 0}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Age Groups */}
      <View style={s.card}>
        <Text style={s.secTitle}>?? Age Groups</Text>
        {data.ageGroups.map(ag => (
          <BarRow key={ag.label} label={ag.label} value={ag.count} max={maxAge} color="#3b5bdb" />
        ))}
      </View>

      {/* Booth Breakdown */}
      <View style={[s.card, { marginBottom: 24 }]}>
        <Text style={s.secTitle}>?? Booth-wise Sentiment</Text>
        {data.boothBreakdown.slice(0, 20).map(booth => {
          const total = booth.total || 1;
          return (
            <View key={booth.boothNumber} style={s.boothRow}>
              <Text style={s.boothNum}>#{booth.boothNumber}</Text>
              <View style={s.boothBar}>
                {[
                  { val: booth.favour, color: SENT_COLORS.favour },
                  { val: booth.against, color: SENT_COLORS.against },
                  { val: booth.neutral, color: SENT_COLORS.neutral },
                  { val: booth.floating, color: SENT_COLORS.floating },
                  { val: booth.unknown, color: SENT_COLORS.unknown },
                ].map(({ val, color }, i) => (
                  <View key={i} style={{
                    flex: val > 0 ? val / total : 0,
                    height: 12, backgroundColor: color,
                  }} />
                ))}
              </View>
              <Text style={s.boothTotal}>{booth.total}</Text>
            </View>
          );
        })}
        {data.boothBreakdown.length > 20 && (
          <Text style={{ color: '#868e96', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            Showing top 20 of {data.boothBreakdown.length} booths
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1a1f2e', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#868e96', fontSize: 12, marginTop: 2 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12,
    padding: 16, elevation: 1 },
  secTitle: { fontSize: 15, fontWeight: '700', color: '#212529', marginBottom: 14 },
  colorStrip: { flexDirection: 'row', height: 8, borderRadius: 4,
    overflow: 'hidden', marginTop: 12, marginBottom: 8 },
  stripSeg: { height: '100%' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 11, color: '#495057' },
  genderRow: { flexDirection: 'row', justifyContent: 'space-around' },
  genderCard: { alignItems: 'center', flex: 1 },
  genderIcon: { fontSize: 28, marginBottom: 4 },
  genderVal: { fontSize: 22, fontWeight: '800' },
  genderLbl: { fontSize: 12, color: '#868e96', marginTop: 2 },
  genderPct: { fontSize: 11, color: '#adb5bd' },
  boothRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  boothNum: { width: 36, fontSize: 11, fontWeight: '700', color: '#495057' },
  boothBar: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden',
    flexDirection: 'row', backgroundColor: '#e9ecef', marginHorizontal: 8 },
  boothTotal: { width: 36, fontSize: 11, color: '#868e96', textAlign: 'right' },
});
