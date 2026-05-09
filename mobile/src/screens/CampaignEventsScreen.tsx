import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCampaignEvents, CampaignEventItem } from '../api/campaign';

const TYPE_ICON: Record<string, string> = {
  Rally: 'megaphone-outline', DoorToDoor: 'walk-outline',
  SmallMeeting: 'people-outline', LargeMeeting: 'business-outline',
  PhoneCall: 'call-outline', Other: 'calendar-outline',
};
const TYPE_COLOR: Record<string, string> = {
  Rally: '#e03131', DoorToDoor: '#2f9e44', SmallMeeting: '#3b5bdb',
  LargeMeeting: '#7950f2', PhoneCall: '#f59f00', Other: '#868e96',
};

export default function CampaignEventsScreen() {
  const [events, setEvents] = useState<CampaignEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);

  const load = async (upcoming = showUpcoming) => {
    try { setEvents(await getCampaignEvents(upcoming)); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleFilter = () => {
    const next = !showUpcoming;
    setShowUpcoming(next);
    setLoading(true);
    load(next);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Campaign Events</Text>
          <Text style={s.sub}>{events.length} events</Text>
        </View>
        <TouchableOpacity style={[s.filterBtn, showUpcoming && s.filterActive]} onPress={toggleFilter}>
          <Ionicons name="calendar-outline" size={16} color={showUpcoming ? '#fff' : '#3b5bdb'} />
          <Text style={[s.filterTxt, showUpcoming && { color: '#fff' }]}>Upcoming</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={e => e.id.toString()}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <View style={s.center}><Text style={{ color: '#868e96' }}>No events found.</Text></View>
        }
        renderItem={({ item: ev }) => {
          const color = TYPE_COLOR[ev.eventType] ?? '#868e96';
          const icon = TYPE_ICON[ev.eventType] ?? 'calendar-outline';
          const date = new Date(ev.scheduledAt);
          return (
            <View style={[s.card, ev.isCompleted && s.completedCard]}>
              <View style={[s.iconBox, { backgroundColor: color + '18' }]}>
                <Ionicons name={icon as any} size={22} color={color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={s.cardTop}>
                  <Text style={s.cardTitle} numberOfLines={1}>{ev.title}</Text>
                  {ev.isCompleted && (
                    <Ionicons name="checkmark-circle" size={18} color="#2f9e44" />
                  )}
                </View>
                <View style={[s.typeBadge, { backgroundColor: color + '18' }]}>
                  <Text style={[s.typeTxt, { color }]}>
                    {ev.eventType.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                </View>
                <Text style={s.location} numberOfLines={1}>?? {ev.location}</Text>
                <Text style={s.dateTime}>
                  ?? {date.toLocaleDateString('en-IN')}  ? {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {(ev.expectedAttendance != null || ev.actualAttendance != null) && (
                  <Text style={s.attendance}>
                    ?? Expected: {ev.expectedAttendance ?? '-'}
                    {ev.actualAttendance != null ? `  ·  Actual: ${ev.actualAttendance}` : ''}
                  </Text>
                )}
                {ev.organizedByName && (
                  <Text style={s.organizer}>?? {ev.organizedByName}</Text>
                )}
                {ev.targetWards && (
                  <Text style={s.wards}>Wards: {ev.targetWards}</Text>
                )}
              </View>
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
  header: { backgroundColor: '#1a1f2e', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#868e96', fontSize: 12, marginTop: 2 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#3b5bdb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  filterActive: { backgroundColor: '#3b5bdb' },
  filterTxt: { color: '#3b5bdb', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start', elevation: 1 },
  completedCard: { opacity: 0.65 },
  iconBox: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#212529', flex: 1 },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3, marginBottom: 6 },
  typeTxt: { fontSize: 11, fontWeight: '700' },
  location: { fontSize: 12, color: '#495057', marginBottom: 2 },
  dateTime: { fontSize: 12, color: '#495057', marginBottom: 2 },
  attendance: { fontSize: 11, color: '#868e96', marginBottom: 2 },
  organizer: { fontSize: 11, color: '#4dabf7' },
  wards: { fontSize: 11, color: '#868e96', marginTop: 2 },
});
