import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLiveTurnout, markVoted, LiveTurnout } from '../api/electionday';
import { getVoters, VoterListItem } from '../api/voters';

export default function ElectionDayScreen() {
  const [turnout, setTurnout] = useState<LiveTurnout | null>(null);
  const [voters, setVoters] = useState<VoterListItem[]>([]);
  const [filtered, setFiltered] = useState<VoterListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, v] = await Promise.all([getLiveTurnout(), getVoters({ pageSize: 200 })]);
      setTurnout(t); setVoters(v.items); setFiltered(v.items);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSearch = (txt: string) => {
    setSearch(txt);
    setFiltered(!txt ? voters : voters.filter(v =>
      v.name.toLowerCase().includes(txt.toLowerCase()) ||
      v.voterId.toLowerCase().includes(txt.toLowerCase())));
  };

  const onMarkVoted = (voter: VoterListItem) => {
    if (voter.electionDayStatus === 'Voted') {
      Alert.alert('Already Voted', `${voter.name} has already been marked.`);
      return;
    }
    Alert.alert('Confirm', `Mark ${voter.name} as voted?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        await markVoted(voter.id);
        Alert.alert('Done', `${voter.name} marked as voted.`);
        load();
      }},
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.liveRow}>
          <View style={s.liveDot} />
          <Text style={s.liveTxt}>LIVE</Text>
        </View>
        <Text style={s.title}>Election Day Tracking</Text>
      </View>

      {/* Overall */}
      <View style={s.overallCard}>
        <Text style={s.overallPct}>{turnout?.overallPercent ?? 0}%</Text>
        <Text style={s.overallLbl}>Overall Turnout</Text>
        <Text style={s.overallSub}>{turnout?.totalVoted} / {turnout?.totalVoters} voters</Text>
      </View>

      {/* Booth bars */}
      <FlatList
        horizontal
        data={turnout?.booths ?? []}
        keyExtractor={b => b.boothNumber.toString()}
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 110 }}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        renderItem={({ item: b }) => (
          <View style={s.boothCard}>
            <Text style={s.boothNum}>#{b.boothNumber}</Text>
            <Text style={s.boothPct}>{b.turnoutPercent}%</Text>
            <View style={s.miniBar}>
              <View style={[s.miniFill, { height: `${b.turnoutPercent}%` as any }]} />
            </View>
            <Text style={s.boothSub}>{b.votedCount}/{b.totalVoters}</Text>
          </View>
        )}
      />

      {/* Voter search */}
      <Text style={[s.sectionTitle, { marginHorizontal: 12 }]}>Mark Voter as Voted</Text>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={16} color="#868e96" style={{ marginRight: 8 }} />
        <TextInput style={s.searchInput} value={search} onChangeText={onSearch}
          placeholder="Search voter name or EPIC..." placeholderTextColor="#adb5bd" />
      </View>

      <FlatList
        data={filtered.slice(0, 25)}
        keyExtractor={v => v.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.voterRow, item.electionDayStatus === 'Voted' && s.votedRow]}
            onPress={() => onMarkVoted(item)}>
            <View style={{ flex: 1 }}>
              <Text style={s.voterName}>{item.name}</Text>
              <Text style={s.voterMeta}>Booth {item.boothNumber} � {item.voterId}</Text>
            </View>
            {item.electionDayStatus === 'Voted'
              ? <Ionicons name="checkmark-circle" size={24} color="#2f9e44" />
              : (
                <TouchableOpacity style={s.markBtn} onPress={() => onMarkVoted(item)}>
                  <Text style={s.markTxt}>Mark</Text>
                </TouchableOpacity>
              )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1a1f2e', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2f9e44', marginRight: 6 },
  liveTxt: { color: '#2f9e44', fontSize: 12, fontWeight: '700' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  overallCard: { backgroundColor: '#3b5bdb', margin: 12, borderRadius: 16, padding: 20, alignItems: 'center' },
  overallPct: { color: '#fff', fontSize: 52, fontWeight: '800' },
  overallLbl: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  overallSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  boothCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, width: 90, alignItems: 'center', elevation: 1 },
  boothNum: { fontSize: 11, color: '#868e96', fontWeight: '700' },
  boothPct: { fontSize: 20, fontWeight: '800', color: '#3b5bdb', marginTop: 2 },
  miniBar: { width: 24, height: 36, backgroundColor: '#e9ecef', borderRadius: 4,
    marginVertical: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  miniFill: { width: '100%', backgroundColor: '#3b5bdb', borderRadius: 4 },
  boothSub: { fontSize: 10, color: '#868e96' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#343a40', marginBottom: 8, marginTop: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 8, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: '#212529' },
  voterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 12, borderRadius: 10, padding: 12, marginBottom: 6, elevation: 1 },
  votedRow: { backgroundColor: '#f8fff9', borderColor: '#d3f9d8', borderWidth: 1 },
  voterName: { fontSize: 14, fontWeight: '700', color: '#212529' },
  voterMeta: { fontSize: 11, color: '#868e96', marginTop: 2 },
  markBtn: { backgroundColor: '#3b5bdb', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  markTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
