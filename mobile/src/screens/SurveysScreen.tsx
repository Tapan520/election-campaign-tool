import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSurveys, SurveyItem } from '../api/surveys';

const CAT_COLOR: Record<string, string> = {
  CandidateAwareness: '#3b5bdb', LocalIssues: '#e03131', PartySupport: '#f59f00',
  DevelopmentFeedback: '#2f9e44', GeneralOpinion: '#7950f2',
};

export default function SurveysScreen() {
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setSurveys(await getSurveys()); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;

  const active = surveys.filter(sv => sv.isActive);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Surveys</Text>
        <Text style={s.sub}>{active.length} active · {surveys.length - active.length} inactive</Text>
      </View>

      {/* Total responses banner */}
      <View style={s.banner}>
        <Ionicons name="stats-chart-outline" size={24} color="#fff" />
        <View style={{ marginLeft: 12 }}>
          <Text style={s.bannerVal}>{surveys.reduce((a, s) => a + s.responseCount, 0)}</Text>
          <Text style={s.bannerLbl}>Total Responses Collected</Text>
        </View>
      </View>

      <FlatList
        data={surveys}
        keyExtractor={sv => sv.id.toString()}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <View style={s.center}><Text style={{ color: '#868e96' }}>No surveys found.</Text></View>
        }
        renderItem={({ item: sv }) => {
          const color = CAT_COLOR[sv.category] ?? '#868e96';
          return (
            <View style={[s.card, { borderLeftColor: color }]}>
              <View style={s.cardTop}>
                <Text style={s.cardTitle} numberOfLines={2}>{sv.title}</Text>
                <View style={[s.activeBadge,
                  { backgroundColor: sv.isActive ? '#d3f9d8' : '#f1f3f5' }]}>
                  <Text style={[s.activeTxt,
                    { color: sv.isActive ? '#2f9e44' : '#868e96' }]}>
                    {sv.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              {sv.description && (
                <Text style={s.desc} numberOfLines={2}>{sv.description}</Text>
              )}
              <View style={s.metaRow}>
                <View style={[s.catBadge, { backgroundColor: color + '18' }]}>
                  <Text style={[s.catTxt, { color }]}>
                    {sv.category.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                </View>
                <View style={s.responseRow}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color="#868e96" />
                  <Text style={s.responseCount}>{sv.responseCount} responses</Text>
                </View>
              </View>
              <Text style={s.date}>
                Created {new Date(sv.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { backgroundColor: '#1a1f2e', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#868e96', fontSize: 12, marginTop: 2 },
  banner: { backgroundColor: '#3b5bdb', margin: 12, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center' },
  bannerVal: { color: '#fff', fontSize: 28, fontWeight: '800' },
  bannerLbl: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#212529', flex: 1, marginRight: 8 },
  activeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  activeTxt: { fontSize: 11, fontWeight: '700' },
  desc: { fontSize: 12, color: '#495057', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  catBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catTxt: { fontSize: 11, fontWeight: '700' },
  responseRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  responseCount: { fontSize: 12, color: '#868e96' },
  date: { fontSize: 11, color: '#adb5bd' },
});
