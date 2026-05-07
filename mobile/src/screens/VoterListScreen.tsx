import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getVoters, VoterListItem } from '../api/voters';

const COLORS: Record<string, string> = {
  Favour: '#2f9e44', Against: '#e03131',
  Neutral: '#1971c2', Floating: '#e67700', Unknown: '#868e96',
};

export default function VoterListScreen() {
  const nav = useNavigation<any>();
  const [voters, setVoters] = useState<VoterListItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (p = 1, q = '', reset = false) => {
    try {
      const res = await getVoters({ search: q || undefined, page: p, pageSize: 30 });
      setTotal(res.total);
      setVoters(prev => reset || p === 1 ? res.items : [...prev, ...res.items]);
      setPage(p);
    } finally {
      setLoading(false); setLoadingMore(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(1, '', true); }, []);

  const onSearch = (text: string) => {
    setSearch(text); setLoading(true); load(1, text, true);
  };

  const loadMore = () => {
    if (!loadingMore && page < Math.ceil(total / 30)) {
      setLoadingMore(true); load(page + 1, search);
    }
  };

  const renderItem = ({ item }: { item: VoterListItem }) => (
    <TouchableOpacity
      style={[s.voterCard, { borderLeftColor: COLORS[item.sentiment] ?? '#adb5bd' }]}
      onPress={() => nav.navigate('VoterDetail', { id: item.id })}>
      <View style={{ flex: 1 }}>
        <Text style={s.name}>{item.name}</Text>
        <Text style={s.meta}>
          {item.voterId} � {item.age}yr {item.gender === 'M' ? '?' : '?'} � Booth {item.boothNumber}
        </Text>
        {item.mobileNumber && (
          <Text style={s.phone}>?? {item.mobileNumber}</Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[s.badge, { backgroundColor: (COLORS[item.sentiment] ?? '#adb5bd') + '20' }]}>
          <Text style={[s.badgeTxt, { color: COLORS[item.sentiment] ?? '#868e96' }]}>
            {item.sentiment}
          </Text>
        </View>
        {item.electionDayStatus === 'Voted' && (
          <View style={[s.badge, { backgroundColor: '#d3f9d8' }]}>
            <Text style={[s.badgeTxt, { color: '#2f9e44' }]}>? Voted</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Voter List</Text>
        <Text style={s.sub}>{total.toLocaleString()} voters</Text>
      </View>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={16} color="#868e96" style={{ marginRight: 8 }} />
        <TextInput style={s.searchInput} value={search} onChangeText={onSearch}
          placeholder="Search name, EPIC, mobile..." placeholderTextColor="#adb5bd" />
        {!!search && (
          <TouchableOpacity onPress={() => onSearch('')}>
            <Ionicons name="close-circle" size={16} color="#adb5bd" />
          </TouchableOpacity>
        )}
      </View>
      {loading
        ? <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>
        : (
          <FlatList data={voters} keyExtractor={v => v.id.toString()}
            renderItem={renderItem} onEndReached={loadMore} onEndReachedThreshold={0.3}
            refreshControl={<RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1, search, true); }} />}
            ListFooterComponent={
              loadingMore ? <ActivityIndicator color="#3b5bdb" style={{ padding: 16 }} /> : null
            }
            ListEmptyComponent={
              <View style={s.center}><Text style={{ color: '#868e96' }}>No voters found.</Text></View>
            }
          />
        )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { backgroundColor: '#1a1f2e', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#868e96', fontSize: 12, marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#212529' },
  voterCard: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8,
    borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 4, elevation: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#212529' },
  meta: { fontSize: 12, color: '#868e96', marginTop: 2 },
  phone: { fontSize: 11, color: '#4dabf7', marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
});
