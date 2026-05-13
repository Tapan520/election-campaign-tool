import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, DashboardStats } from '../api/dashboard';
import { AnnouncementItem, CATEGORY_HEX, CATEGORY_ICONS, getAnnouncements, acknowledgeAnnouncement } from '../api/announcements';

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
const nav = useNavigation<any>();
const [stats,         setStats]         = useState<DashboardStats | null>(null);
const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
const [loading,       setLoading]       = useState(true);
const [refreshing,    setRefreshing]    = useState(false);

const load = useCallback(async () => {
  try {
    const [s, a] = await Promise.all([getDashboardStats(), getAnnouncements()]);
    setStats(s);
    setAnnouncements(a);
  }
  catch { /* offline — keep old data */ }
  finally { setLoading(false); setRefreshing(false); }
}, []);

useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;
  }

  const firstName   = user?.fullName?.split(' ')[0] ?? 'User';
  const pinned      = announcements.filter(a => a.isPinned);
  const recent      = announcements.filter(a => !a.isPinned).slice(0, 3);
  const unreadCount = announcements.filter(a => a.requiresAcknowledgement && !a.isAcknowledged).length;

  const handleAck = async (id: number) => {
    try {
      await acknowledgeAnnouncement(id);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isAcknowledged: true } : a));
    } catch {}
  };

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

      {/* ── Pinned Critical Alerts ── */}
      {pinned.map(a => (
        <View key={a.id} style={s.criticalBanner}>
          <View style={s.criticalRow}>
            <Ionicons name="warning" size={18} color="#fff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.criticalTitle}>{a.title}</Text>
              <Text style={s.criticalBody} numberOfLines={2}>{a.body}</Text>
            </View>
          </View>
          {a.requiresAcknowledgement && !a.isAcknowledged && (
            <TouchableOpacity style={s.criticalAckBtn} onPress={() => handleAck(a.id)}>
              <Text style={s.criticalAckTxt}>Acknowledge</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* ── Unread acknowledgement nudge ── */}
      {unreadCount > 0 && (
        <TouchableOpacity style={s.unreadBanner} onPress={() => nav.navigate('Announcements')}>
          <Ionicons name="notifications" size={16} color="#e67700" />
          <Text style={s.unreadTxt}>
            {unreadCount} announcement{unreadCount > 1 ? 's' : ''} need your acknowledgement
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#e67700" />
        </TouchableOpacity>
      )}

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
      <View style={[s.sentimentRow, { marginBottom: 16 }]}>
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

      {/* ── Recent Announcements ── */}
      <View style={s.annHeader}>
        <Text style={s.sectionTitle}>Recent Announcements</Text>
        <TouchableOpacity onPress={() => nav.navigate('Announcements')}>
          <Text style={s.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={[s.sentimentRow, { flexDirection: 'column', padding: 0, marginBottom: 28, overflow: 'hidden' }]}>
        {recent.length === 0 ? (
          <Text style={{ color: '#adb5bd', padding: 16, textAlign: 'center', fontSize: 13 }}>No announcements yet.</Text>
        ) : recent.map((a, idx) => {
          const hex  = CATEGORY_HEX[a.categoryColor] ?? '#868e96';
          const icon = CATEGORY_ICONS[a.category] ?? 'megaphone';
          return (
            <View key={a.id} style={[s.annRow, idx < recent.length - 1 && s.annRowBorder]}>
              <View style={[s.annIcon, { backgroundColor: hex + '22' }]}>
                <Ionicons name={icon as any} size={14} color={hex} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <View style={[s.catPill, { backgroundColor: hex + '22' }]}>
                    <Text style={[s.catPillTxt, { color: hex }]}>{a.categoryLabel}</Text>
                  </View>
                  {a.requiresAcknowledgement && !a.isAcknowledged && (
                    <View style={s.actionPill}>
                      <Text style={s.actionPillTxt}>Action needed</Text>
                    </View>
                  )}
                </View>
                <Text style={s.annTitle} numberOfLines={1}>{a.title}</Text>
                <Text style={s.annMeta}>{a.createdByName}</Text>
              </View>
            </View>
          );
        })}
        <TouchableOpacity style={s.annFooter} onPress={() => nav.navigate('Announcements')}>
          <Ionicons name="add-circle-outline" size={16} color="#3b5bdb" />
          <Text style={s.annFooterTxt}>Post New Announcement</Text>
        </TouchableOpacity>
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

  /* Critical alerts */
  criticalBanner: { backgroundColor: '#e03131', marginHorizontal: 16, marginTop: 12,
                    borderRadius: 14, padding: 14 },
  criticalRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  criticalTitle:{ color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 3 },
  criticalBody: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 17 },
  criticalAckBtn:{ marginTop: 10, alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.2)',
                   borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  criticalAckTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },

  /* Unread nudge */
  unreadBanner: { flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: '#fff3bf', marginHorizontal: 16, marginTop: 10,
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  unreadTxt:    { flex: 1, color: '#e67700', fontSize: 13, fontWeight: '600' },

  /* Announcements widget */
  annHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  seeAll:       { fontSize: 13, color: '#3b5bdb', fontWeight: '600' },
  annRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  annRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  annIcon:      { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  catPill:      { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  catPillTxt:   { fontSize: 10, fontWeight: '700' },
  actionPill:   { backgroundColor: '#fff3bf', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  actionPillTxt:{ fontSize: 10, fontWeight: '700', color: '#e67700' },
  annTitle:     { fontSize: 13, fontWeight: '700', color: '#212529', marginTop: 3 },
  annMeta:      { fontSize: 11, color: '#adb5bd', marginTop: 2 },
  annFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: 14, borderTopWidth: 1, borderTopColor: '#f1f3f5' },
  annFooterTxt: { color: '#3b5bdb', fontSize: 13, fontWeight: '600' },
});
