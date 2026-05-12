import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, DashboardStats } from '../api/dashboard';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

interface StatCardProps {
  icon: string; label: string; value: string | number; color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <View style={[s.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={[s.cardIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View style={s.cardText}>
        <Text style={s.cardValue} numberOfLines={1}>{value}</Text>
        <Text style={s.cardLabel} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setStats(await getDashboardStats()); }
    catch { /* offline — keep old data */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;
  }

  const firstName = user?.fullName?.split(' ')[0] ?? 'User';

  return (
    <ScrollView
      style={s.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Hello, {firstName}</Text>
          <Text style={s.role}>{user?.role} — Campaign Dashboard</Text>
        </View>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Turnout Banner ── */}
      <View style={s.banner}>
        <Text style={s.bannerLabel}>Overall Turnout</Text>
        <Text style={s.bannerPct}>{stats?.turnoutPercent ?? 0}%</Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${stats?.turnoutPercent ?? 0}%` as any }]} />
        </View>
        <Text style={s.bannerSub}>
          {stats?.totalVoted ?? 0} of {stats?.totalVoters ?? 0} voters
        </Text>
      </View>

      {/* ── Overview Grid ── */}
      <Text style={s.sectionTitle}>Overview</Text>
      <View style={s.grid}>
        <StatCard icon="people"        label="Total Voters"     value={(stats?.totalVoters ?? 0).toLocaleString()} color="#3b5bdb" />
        <StatCard icon="thumbs-up"     label="In Favour"        value={(stats?.favourVoters ?? 0).toLocaleString()} color="#2f9e44" />
        <StatCard icon="thumbs-down"   label="Against"          value={(stats?.againstVoters ?? 0).toLocaleString()} color="#e03131" />
        <StatCard icon="location"      label="Booths"           value={stats?.totalBooths ?? 0} color="#f59f00" />
        <StatCard icon="alert-circle"  label="Open Grievances"  value={stats?.openGrievances ?? 0} color="#e03131" />
        <StatCard icon="person-add"    label="Volunteers"       value={stats?.totalVolunteers ?? 0} color="#7950f2" />
      </View>

      {/* ── Sentiment Breakdown ── */}
      <Text style={s.sectionTitle}>Sentiment Breakdown</Text>
      <View style={s.sentimentRow}>
        {[
          { label: 'Favour',  val: stats?.favourVoters  ?? 0, color: '#2f9e44' },
          { label: 'Against', val: stats?.againstVoters ?? 0, color: '#e03131' },
          { label: 'Neutral', val: stats?.neutralVoters ?? 0, color: '#4dabf7' },
          { label: 'Unknown', val: stats?.unknownVoters ?? 0, color: '#adb5bd' },
        ].map(({ label, val, color }) => (
          <View key={label} style={s.sentimentItem}>
            <Text style={[s.sentimentVal, { color }]}>{val}</Text>
            <Text style={s.sentimentLbl}>{label}</Text>
          </View>
        ))}
      </View>

      {/* ── Voted vs Not Voted ── */}
      <Text style={s.sectionTitle}>Election Day Status</Text>
      <View style={[s.sentimentRow, { marginBottom: 28 }]}>
        {[
          { label: 'Voted',     val: stats?.totalVoted ?? 0,
            color: '#2f9e44' },
          { label: 'Not Voted', val: (stats?.totalVoters ?? 0) - (stats?.totalVoted ?? 0),
            color: '#e03131' },
          { label: 'Turnout',   val: `${stats?.turnoutPercent ?? 0}%`,
            color: '#3b5bdb' },
        ].map(({ label, val, color }) => (
          <View key={label} style={s.sentimentItem}>
            <Text style={[s.sentimentVal, { color }]}>{val}</Text>
            <Text style={s.sentimentLbl}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0f2f5' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Header */
  header:       { backgroundColor: '#1a1f2e', padding: 20, paddingTop: 52,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting:     { color: '#fff', fontSize: 20, fontWeight: '700' },
  role:         { color: '#868e96', fontSize: 12, marginTop: 3 },
  logoutBtn:    { padding: 8 },

  /* Turnout banner */
  banner:       { backgroundColor: '#3b5bdb', margin: 16, borderRadius: 16, padding: 20 },
  bannerLabel:  { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  bannerPct:    { color: '#fff', fontSize: 52, fontWeight: '800' },
  progressBar:  { height: 8, backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  bannerSub:    { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 6 },

  /* Section title */
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#343a40',
                  marginHorizontal: 16, marginTop: 12, marginBottom: 8 },

  /* Stat card grid — fixed width prevents flex stretching */
  grid:         { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14,
                  margin: 8, flexDirection: 'row', alignItems: 'center',
                  width: CARD_WIDTH },           /* ← fixed pixel width, no flex:1 */
  cardIcon:     { width: 44, height: 44, borderRadius: 10,
                  justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardText:     { flex: 1, marginLeft: 12, overflow: 'hidden' },
  cardValue:    { fontSize: 20, fontWeight: '800', color: '#212529' },
  cardLabel:    { fontSize: 11, color: '#868e96', marginTop: 2 },

  /* Sentiment row */
  sentimentRow: { flexDirection: 'row', backgroundColor: '#fff',
                  marginHorizontal: 16, marginBottom: 8,
                  borderRadius: 16, padding: 16 },
  sentimentItem:{ flex: 1, alignItems: 'center' },
  sentimentVal: { fontSize: 22, fontWeight: '800' },
  sentimentLbl: { fontSize: 11, color: '#868e96', marginTop: 2 },
});
