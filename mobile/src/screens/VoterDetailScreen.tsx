import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVoterDetail, updateSentiment, logVisit, VoterDetail } from '../api/voters';

const SENTIMENTS = ['Favour', 'Against', 'Neutral', 'Floating', 'Unknown'];
const SENT_COLOR: Record<string, string> = {
  Favour: '#2f9e44', Against: '#e03131', Neutral: '#1971c2',
  Floating: '#e67700', Unknown: '#868e96',
};

export default function VoterDetailScreen({ route }: any) {
  const { id } = route.params;
  const [voter, setVoter] = useState<VoterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentModal, setSentModal] = useState(false);

  const reload = async () => {
    setLoading(true);
    try { setVoter(await getVoterDetail(id)); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const onSentiment = async (s: string) => {
    setSentModal(false);
    await updateSentiment(id, s);
    Alert.alert('Updated', `Sentiment set to ${s}`);
    reload();
  };

  const onLogVisit = () => {
    Alert.alert('Log Visit', 'Notes for this visit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'No notes', onPress: () => doLogVisit('') },
    ]);
  };

  const doLogVisit = async (notes: string) => {
    await logVisit(id, 'Visited', voter?.sentiment ?? 'Unknown', notes || undefined);
    Alert.alert('Visit Logged', 'Door-to-door visit recorded.');
    reload();
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;
  if (!voter) return <View style={s.center}><Text>Voter not found.</Text></View>;

  const sc = SENT_COLOR[voter.sentiment] ?? '#868e96';

  return (
    <ScrollView style={s.container}>
      {/* Profile */}
      <View style={s.profile}>
        <View style={s.avatar}><Text style={s.avatarTxt}>{voter.name[0]}</Text></View>
        <Text style={s.voterName}>{voter.name}</Text>
        {voter.nameLocal && <Text style={s.nameLocal}>{voter.nameLocal}</Text>}
        <Text style={s.epic}>{voter.voterId}</Text>
        <View style={[s.sentBadge, { backgroundColor: sc + '22' }]}>
          <Text style={[s.sentTxt, { color: sc }]}>{voter.sentiment}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={s.card}>
        {([
          ['Serial', voter.serialNumber.toString()],
          ['Age', voter.age.toString()],
          ['Gender', voter.gender === 'M' ? 'Male' : voter.gender === 'F' ? 'Female' : 'Other'],
          ['Booth', voter.boothNumber.toString()],
          ['Ward', voter.wardNumber ?? '�'],
          ['Mobile', voter.mobileNumber ?? '�'],
          ['Father/Husband', voter.fatherHusbandName ?? '�'],
          ['Address', voter.address],
          ['Election Status', voter.electionDayStatus],
        ] as [string, string][]).map(([lbl, val]) => (
          <View key={lbl} style={s.infoRow}>
            <Text style={s.infoLbl}>{lbl}</Text>
            <Text style={s.infoVal}>{val}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={s.actionsRow}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#3b5bdb' }]}
          onPress={() => setSentModal(true)}>
          <Ionicons name="heart-outline" size={18} color="#fff" />
          <Text style={s.actionTxt}>Update Sentiment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#2f9e44' }]}
          onPress={onLogVisit}>
          <Ionicons name="walk-outline" size={18} color="#fff" />
          <Text style={s.actionTxt}>Log Visit</Text>
        </TouchableOpacity>
      </View>

      {/* Visit history */}
      <View style={s.card}>
        <Text style={s.secTitle}>Visit History ({voter.visits.length})</Text>
        {voter.visits.length === 0
          ? <Text style={s.emptyTxt}>No visits recorded.</Text>
          : voter.visits.map(v => (
            <View key={v.id} style={s.visitRow}>
              <Ionicons name="walk-outline" size={14} color="#4dabf7" />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={s.visitWorker}>{v.workerName} � {v.status}</Text>
                <Text style={s.visitDate}>{new Date(v.visitedAt).toLocaleDateString('en-IN')}</Text>
                {v.notes && <Text style={s.visitNote}>{v.notes}</Text>}
              </View>
              <Text style={{ fontSize: 11, color: SENT_COLOR[v.sentiment] ?? '#868e96', fontWeight: '600' }}>
                {v.sentiment}
              </Text>
            </View>
          ))
        }
      </View>

      {/* Sentiment modal */}
      <Modal visible={sentModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Update Sentiment</Text>
            {SENTIMENTS.map(snt => (
              <TouchableOpacity key={snt} style={s.modalOpt} onPress={() => onSentiment(snt)}>
                <Text style={s.modalOptTxt}>{snt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.modalCancel} onPress={() => setSentModal(false)}>
              <Text style={{ color: '#868e96', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profile: { backgroundColor: '#1a1f2e', alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#3b5bdb',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarTxt: { color: '#fff', fontSize: 28, fontWeight: '800' },
  voterName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  nameLocal: { color: '#adb5bd', fontSize: 14 },
  epic: { color: '#4dabf7', fontSize: 12, fontFamily: 'monospace', marginTop: 4 },
  sentBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 10 },
  sentTxt: { fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  infoLbl: { fontSize: 13, color: '#868e96', fontWeight: '600' },
  infoVal: { fontSize: 13, color: '#212529', flex: 1, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 12, marginBottom: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10 },
  actionTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  secTitle: { fontSize: 14, fontWeight: '700', color: '#343a40', marginBottom: 10 },
  emptyTxt: { color: '#868e96', fontSize: 13, textAlign: 'center', padding: 8 },
  visitRow: { flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  visitWorker: { fontSize: 13, fontWeight: '600', color: '#343a40' },
  visitDate: { fontSize: 11, color: '#868e96' },
  visitNote: { fontSize: 12, color: '#495057', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center', color: '#212529' },
  modalOpt: { padding: 14, borderRadius: 8, backgroundColor: '#f8f9fa', marginBottom: 8 },
  modalOptTxt: { fontSize: 15, fontWeight: '600', color: '#343a40', textAlign: 'center' },
  modalCancel: { padding: 14, alignItems: 'center' },
});
