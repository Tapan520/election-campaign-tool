import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVolunteers, VolunteerItem } from '../api/volunteers';

const TASK_COLOR: Record<string, string> = {
  BoothManagement: '#3b5bdb', VoterOutreach: '#2f9e44', DataEntry: '#f59f00',
  Transport: '#e67700', Communication: '#7950f2', Other: '#868e96',
};

export default function VolunteersScreen() {
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setVolunteers(await getVolunteers()); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;

  const active = volunteers.filter(v => v.isActive);
  const inactive = volunteers.filter(v => !v.isActive);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Volunteers</Text>
        <Text style={s.sub}>{active.length} active · {inactive.length} inactive</Text>
      </View>

      {/* Summary row */}
      <View style={s.summaryRow}>
        {Object.entries(
          volunteers.reduce((acc, v) => {
            acc[v.task] = (acc[v.task] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).slice(0, 4).map(([task, count]) => (
          <View key={task} style={[s.summaryCard, { borderTopColor: TASK_COLOR[task] ?? '#868e96' }]}>
            <Text style={[s.summaryCount, { color: TASK_COLOR[task] ?? '#868e96' }]}>{count}</Text>
            <Text style={s.summaryLabel}>{task.replace(/([A-Z])/g, ' $1').trim()}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={volunteers}
        keyExtractor={v => v.id.toString()}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <View style={s.center}><Text style={{ color: '#868e96' }}>No volunteers found.</Text></View>
        }
        renderItem={({ item: v }) => (
          <View style={[s.card, !v.isActive && s.inactiveCard]}>
            <View style={s.cardLeft}>
              <View style={[s.avatar, { backgroundColor: (TASK_COLOR[v.task] ?? '#868e96') + '22' }]}>
                <Ionicons name="person-outline" size={20} color={TASK_COLOR[v.task] ?? '#868e96'} />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={s.nameRow}>
                <Text style={s.name}>{v.name}</Text>
                {!v.isActive && (
                  <View style={s.inactiveBadge}>
                    <Text style={s.inactiveTxt}>Inactive</Text>
                  </View>
                )}
              </View>
              <Text style={s.phone}>?? {v.phone}</Text>
              <View style={s.metaRow}>
                <View style={[s.taskBadge, { backgroundColor: (TASK_COLOR[v.task] ?? '#868e96') + '18' }]}>
                  <Text style={[s.taskTxt, { color: TASK_COLOR[v.task] ?? '#868e96' }]}>
                    {v.task.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                </View>
                {v.assignedArea && <Text style={s.area}>?? {v.assignedArea}</Text>}
              </View>
              {v.assignedBoothNumbers && (
                <Text style={s.booths}>Booths: {v.assignedBoothNumbers}</Text>
              )}
            </View>
          </View>
        )}
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
  summaryRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12,
    marginTop: 12, borderRadius: 12, overflow: 'hidden', elevation: 1 },
  summaryCard: { flex: 1, alignItems: 'center', padding: 12, borderTopWidth: 3 },
  summaryCount: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: '#868e96', textAlign: 'center', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start', elevation: 1 },
  inactiveCard: { opacity: 0.6 },
  cardLeft: { justifyContent: 'flex-start' },
  avatar: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', color: '#212529' },
  inactiveBadge: { backgroundColor: '#f1f3f5', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  inactiveTxt: { fontSize: 10, color: '#868e96', fontWeight: '600' },
  phone: { fontSize: 12, color: '#4dabf7', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  taskTxt: { fontSize: 11, fontWeight: '700' },
  area: { fontSize: 11, color: '#868e96' },
  booths: { fontSize: 11, color: '#495057', marginTop: 4 },
});
