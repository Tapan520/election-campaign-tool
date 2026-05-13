import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, ScrollView,
  Modal, TextInput, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AnnouncementItem, CATEGORY_HEX, CATEGORY_ICONS,
  getAnnouncements, acknowledgeAnnouncement,
  createAnnouncement, deactivateAnnouncement,
} from '../api/announcements';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { key: '',                    label: 'All' },
  { key: 'CriticalAlert',       label: 'Critical' },
  { key: 'CampaignAnnouncement',label: 'Campaign' },
  { key: 'ECComplianceNotice',  label: 'EC Notice' },
  { key: 'DailyBriefing',       label: 'Briefing' },
  { key: 'Motivation',          label: 'Motivation' },
  { key: 'LiveDataNudge',       label: 'Live Nudge' },
];

const POSTER_ROLES = ['Admin', 'CampaignManager', 'Candidate', 'FieldWorker', 'BoothAgent'];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ?? Announcement card ??????????????????????????????????????????? */
interface CardProps {
  item: AnnouncementItem;
  userId: string;
  onAck: (id: number) => void;
  onRemove: (id: number) => void;
}

function AnnouncementCard({ item, userId, onAck, onRemove }: CardProps) {
  const hex  = CATEGORY_HEX[item.categoryColor] ?? '#868e96';
  const icon = CATEGORY_ICONS[item.category] ?? 'megaphone';
  const isOwner = item.createdByName !== 'System (Auto)';

  return (
    <View style={[s.card, item.isPinned && s.cardPinned]}>
      {/* top row */}
      <View style={s.cardHeader}>
        <View style={[s.iconCircle, { backgroundColor: hex + '22' }]}>
          <Ionicons name={icon as any} size={18} color={hex} />
        </View>
        <View style={s.categoryBadge}>
          <Text style={[s.categoryText, { color: hex }]}>{item.categoryLabel}</Text>
        </View>
        {item.isPinned && (
          <View style={s.pinnedBadge}>
            <Ionicons name="pin" size={11} color="#fff" />
            <Text style={s.pinnedText}>PINNED</Text>
          </View>
        )}
        {item.requiresAcknowledgement && !item.isAcknowledged && (
          <View style={s.actionBadge}>
            <Text style={s.actionBadgeText}>Action needed</Text>
          </View>
        )}
        {item.isAcknowledged && (
          <View style={s.ackDone}>
            <Ionicons name="checkmark-circle" size={14} color="#2f9e44" />
            <Text style={s.ackDoneText}>Acked</Text>
          </View>
        )}
      </View>

      {/* title & body */}
      <Text style={s.title}>{item.title}</Text>
      <Text style={s.body}>{item.body}</Text>

      {/* footer */}
      <View style={s.footer}>
        <Text style={s.footerTxt}>
          <Ionicons name="person-outline" size={11} /> {item.createdByName}
          {'  '}
          <Ionicons name="time-outline" size={11} /> {timeAgo(item.createdAt)}
        </Text>
        {item.requiresAcknowledgement && (
          <Text style={s.footerTxt}>
            <Ionicons name="checkmark-done-outline" size={11} /> {item.acknowledgementCount} acked
          </Text>
        )}
      </View>

      {/* actions */}
      <View style={s.actions}>
        {item.requiresAcknowledgement && !item.isAcknowledged && (
          <TouchableOpacity
            style={[s.ackBtn, { backgroundColor: hex }]}
            onPress={() => onAck(item.id)}>
            <Ionicons name="checkmark-done" size={15} color="#fff" />
            <Text style={s.ackBtnText}>Acknowledge & Confirm</Text>
          </TouchableOpacity>
        )}
        {isOwner && (
          <TouchableOpacity style={s.removeBtn} onPress={() => onRemove(item.id)}>
            <Ionicons name="trash-outline" size={15} color="#adb5bd" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ?? Post Announcement Modal ????????????????????????????????????? */
interface PostModalProps {
  visible: boolean;
  onClose: () => void;
  onPosted: () => void;
}

function PostModal({ visible, onClose, onPosted }: PostModalProps) {
  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [category, setCategory] = useState('CampaignAnnouncement');
  const [requiresAck, setRequiresAck] = useState(false);
  const [posting,  setPosting]  = useState(false);

  const reset = () => { setTitle(''); setBody(''); setCategory('CampaignAnnouncement'); setRequiresAck(false); };

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Required', 'Title and message are required.'); return;
    }
    try {
      setPosting(true);
      await createAnnouncement({ title: title.trim(), body: body.trim(), category, requiresAcknowledgement: requiresAck });
      reset(); onPosted();
    } catch {
      Alert.alert('Error', 'Failed to post announcement. Please try again.');
    } finally { setPosting(false); }
  };

  const cats = CATEGORIES.filter(c => c.key !== '');
  const hex  = CATEGORY_HEX[{ CriticalAlert:'danger', ECComplianceNotice:'warning', DailyBriefing:'info', Motivation:'success', LiveDataNudge:'primary', CampaignAnnouncement:'secondary' }[category] ?? 'secondary'] ?? '#868e96';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={pm.container}>
          <View style={pm.header}>
            <Text style={pm.headerTitle}>New Announcement</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close" size={24} color="#212529" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

            {/* Category selector */}
            <Text style={pm.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {cats.map(c => {
                const cHex = CATEGORY_HEX[{ CriticalAlert:'danger', ECComplianceNotice:'warning', DailyBriefing:'info', Motivation:'success', LiveDataNudge:'primary', CampaignAnnouncement:'secondary' }[c.key] ?? 'secondary'] ?? '#868e96';
                return (
                  <TouchableOpacity key={c.key}
                    style={[pm.catChip, category === c.key && { backgroundColor: cHex, borderColor: cHex }]}
                    onPress={() => setCategory(c.key)}>
                    <Text style={[pm.catChipText, category === c.key && { color: '#fff' }]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {category === 'CriticalAlert' && (
              <View style={pm.warningBox}>
                <Ionicons name="warning" size={16} color="#e03131" />
                <Text style={pm.warningText}>Critical alerts are pinned at the top of every dashboard.</Text>
              </View>
            )}

            <Text style={pm.label}>Title *</Text>
            <TextInput style={pm.input} placeholder="Short, clear headline..."
              value={title} onChangeText={setTitle} maxLength={200} />

            <Text style={pm.label}>Message *</Text>
            <TextInput style={[pm.input, pm.textArea]} placeholder="Write your announcement..."
              value={body} onChangeText={setBody} multiline numberOfLines={6}
              textAlignVertical="top" />

            <View style={pm.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={pm.label}>Require acknowledgement</Text>
                <Text style={pm.switchDesc}>Recipients must confirm they've read this.</Text>
              </View>
              <Switch value={requiresAck || category === 'ECComplianceNotice'}
                onValueChange={setRequiresAck}
                trackColor={{ true: hex }}
                disabled={category === 'ECComplianceNotice'} />
            </View>

            <TouchableOpacity style={[pm.postBtn, { backgroundColor: hex }, posting && { opacity: 0.6 }]}
              onPress={submit} disabled={posting}>
              {posting
                ? <ActivityIndicator color="#fff" />
                : <><Ionicons name="send" size={18} color="#fff" /><Text style={pm.postBtnText}> Post Announcement</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ?? Main Screen ????????????????????????????????????????????????? */
export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const [items,      setItems]      = useState<AnnouncementItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category,   setCategory]   = useState('');
  const [showModal,  setShowModal]  = useState(false);

  const load = useCallback(async () => {
    try { setItems(await getAnnouncements(category || undefined)); }
    catch { /* keep stale */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const handleAck = async (id: number) => {
    try {
      await acknowledgeAnnouncement(id);
      setItems(prev => prev.map(a => a.id === id ? { ...a, isAcknowledged: true, acknowledgementCount: a.acknowledgementCount + 1 } : a));
    } catch { Alert.alert('Error', 'Could not acknowledge. Please try again.'); }
  };

  const handleRemove = (id: number) => {
    Alert.alert('Remove Announcement', 'Remove this announcement from the feed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await deactivateAnnouncement(id);
            setItems(prev => prev.filter(a => a.id !== id));
          } catch { Alert.alert('Error', 'Failed to remove.'); }
        }
      },
    ]);
  };

  const pinned  = items.filter(a => a.isPinned);
  const regular = items.filter(a => !a.isPinned);
  const unread  = items.filter(a => a.requiresAcknowledgement && !a.isAcknowledged).length;

  if (loading) return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Announcements</Text>
          <Text style={s.headerSub}>
            {items.length} active{unread > 0 ? ` · ${unread} need your action` : ''}
          </Text>
        </View>
        <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category filter tabs */}
      <View style={s.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.key}
              style={[s.tab, category === c.key && s.tabActive]}
              onPress={() => { setCategory(c.key); }}>
              <Text style={[s.tabText, category === c.key && s.tabTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={[...pinned, ...regular]}
        keyExtractor={a => a.id.toString()}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="megaphone-outline" size={48} color="#dee2e6" />
            <Text style={s.emptyText}>No announcements right now</Text>
          </View>
        }
        renderItem={({ item }) => (
          <AnnouncementCard item={item} userId={user?.userId ?? ''} onAck={handleAck} onRemove={handleRemove} />
        )}
      />

      <PostModal visible={showModal} onClose={() => setShowModal(false)} onPosted={() => { setShowModal(false); load(); }} />
    </View>
  );
}

/* ?? Styles ?????????????????????????????????????????????????????? */
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0f2f5' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { backgroundColor: '#1a1f2e', paddingTop: 52, paddingBottom: 16,
                  paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle:  { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerSub:    { color: '#868e96', fontSize: 12, marginTop: 2 },
  fab:          { backgroundColor: '#3b5bdb', borderRadius: 10, padding: 8 },
  tabs:         { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f3f5', paddingVertical: 10 },
  tab:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: '#f1f3f5', borderWidth: 1, borderColor: '#dee2e6' },
  tabActive:    { backgroundColor: '#3b5bdb', borderColor: '#3b5bdb' },
  tabText:      { fontSize: 12, fontWeight: '600', color: '#495057' },
  tabTextActive:{ color: '#fff' },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 16,
                  marginBottom: 12, elevation: 1 },
  cardPinned:   { borderWidth: 2, borderColor: '#e03131' },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  iconCircle:   { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  categoryBadge:{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f1f3f5', borderRadius: 6 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  pinnedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3,
                  backgroundColor: '#e03131', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  pinnedText:   { color: '#fff', fontSize: 10, fontWeight: '800' },
  actionBadge:  { backgroundColor: '#fff3bf', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  actionBadgeText:{ color: '#e67700', fontSize: 10, fontWeight: '700' },
  ackDone:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ackDoneText:  { color: '#2f9e44', fontSize: 11, fontWeight: '600' },
  title:        { fontSize: 15, fontWeight: '700', color: '#212529', marginBottom: 6 },
  body:         { fontSize: 13, color: '#495057', lineHeight: 20, marginBottom: 10 },
  footer:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  footerTxt:    { fontSize: 11, color: '#adb5bd' },
  actions:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ackBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1,
                  paddingVertical: 10, borderRadius: 10, justifyContent: 'center' },
  ackBtnText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  removeBtn:    { padding: 8 },
  empty:        { alignItems: 'center', paddingVertical: 60 },
  emptyText:    { color: '#adb5bd', marginTop: 12, fontSize: 14 },
});

const pm = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#212529' },
  label:        { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 6 },
  input:        { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 10,
                  paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#212529', marginBottom: 16 },
  textArea:     { height: 140, textAlignVertical: 'top' },
  catChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  borderWidth: 1, borderColor: '#dee2e6', marginRight: 8 },
  catChipText:  { fontSize: 12, fontWeight: '600', color: '#495057' },
  warningBox:   { flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: '#fff5f5', borderRadius: 10, padding: 12, marginBottom: 16 },
  warningText:  { flex: 1, fontSize: 12, color: '#e03131' },
  switchRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa',
                  borderRadius: 12, padding: 14, marginBottom: 20, gap: 12 },
  switchDesc:   { fontSize: 11, color: '#868e96', marginTop: 2 },
  postBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  postBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 6 },
});
