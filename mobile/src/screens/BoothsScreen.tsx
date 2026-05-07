import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import apiClient from '../api/client';

interface Booth {
  id: number; boothNumber: number; boothName: string; address: string;
  wardNumber?: string; totalVoters: number; maleVoters: number;
  femaleVoters: number; votedCount: number; turnoutPercent: number;
  assignedAgentName?: string; assignedAgentPhone?: string;
}

export default function BoothsScreen() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await apiClient.get<Booth[]>('/booths');
      setBooths(data);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Booth Management</Text>
        <Text style={s.sub}>{booths.length} booths</Text>
      </View>
      <FlatList
        data={booths}
        keyExtractor={b => b.id.toString()}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item: b }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.numBadge}><Text style={s.numTxt}>#{b.boothNumber}</Text></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.boothName}>{b.boothName}</Text>
                <Text style={s.addr} numberOfLines={1}>{b.address}</Text>
              </View>
              <Text style={s.pct}>{b.turnoutPercent}%</Text>
            </View>
            <View style={s.bar}>
              <View style={[s.barFill, { width: `${b.turnoutPercent}%` as any }]} />
            </View>
            <View style={s.statsRow}>
              <Text style={s.stat}>?? {b.totalVoters}</Text>
              <Text style={s.stat}>? {b.maleVoters}</Text>
              <Text style={s.stat}>? {b.femaleVoters}</Text>
              <Text style={s.stat}>? {b.votedCount} voted</Text>
            </View>
            {b.assignedAgentName && (
              <Text style={s.agent}>?? {b.assignedAgentName}
                {b.assignedAgentPhone ? ` � ${b.assignedAgentPhone}` : ''}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1a1f2e', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#868e96', fontSize: 12, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  numBadge: { backgroundColor: '#3b5bdb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  numTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  boothName: { fontSize: 14, fontWeight: '700', color: '#212529' },
  addr: { fontSize: 11, color: '#868e96', marginTop: 1 },
  pct: { fontSize: 22, fontWeight: '800', color: '#3b5bdb' },
  bar: { height: 6, backgroundColor: '#e9ecef', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  barFill: { height: '100%', backgroundColor: '#3b5bdb', borderRadius: 3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  stat: { fontSize: 12, color: '#495057' },
  agent: { fontSize: 12, color: '#2f9e44', marginTop: 8, fontWeight: '600' },
});
