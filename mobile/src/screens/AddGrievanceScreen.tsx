import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createGrievance } from '../api/grievances';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function AddGrievanceScreen() {
  const nav = useNavigation();
  const [form, setForm] = useState({
    title: '', description: '', reportedBy: '',
    reporterPhone: '', priority: 'Medium', ward: '', location: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Validation Error', 'Title and description are required.');
      return;
    }
    setLoading(true);
    try {
      await createGrievance(form);
      Alert.alert('Submitted!', 'Grievance recorded successfully.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit grievance. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.form}>
        {([
          ['title', 'Issue Title *', 'Brief summary of the issue'],
          ['reportedBy', 'Reported By', 'Name of reporter'],
          ['reporterPhone', 'Phone', '10-digit mobile'],
          ['ward', 'Ward No.', 'Ward number or name'],
          ['location', 'Location', 'Where is this issue?'],
        ] as [string, string, string][]).map(([key, label, ph]) => (
          <View key={key} style={s.field}>
            <Text style={s.label}>{label}</Text>
            <TextInput style={s.input} value={(form as any)[key]}
              onChangeText={v => set(key, v)} placeholder={ph}
              placeholderTextColor="#adb5bd"
              keyboardType={key === 'reporterPhone' ? 'phone-pad' : 'default'} />
          </View>
        ))}

        <View style={s.field}>
          <Text style={s.label}>Description *</Text>
          <TextInput style={[s.input, s.textarea]} value={form.description}
            onChangeText={v => set('description', v)}
            placeholder="Detailed description..." placeholderTextColor="#adb5bd"
            multiline numberOfLines={4} />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Priority</Text>
          <View style={s.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p}
                style={[s.priBtn, form.priority === p && s.priBtnActive]}
                onPress={() => set('priority', p)}>
                <Text style={[s.priTxt, form.priority === p && s.priTxtActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitTxt}>Submit Grievance</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  form: { padding: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#343a40', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 13,
    fontSize: 14, color: '#212529', borderWidth: 1, borderColor: '#dee2e6' },
  textarea: { height: 100, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#dee2e6', alignItems: 'center' },
  priBtnActive: { backgroundColor: '#3b5bdb', borderColor: '#3b5bdb' },
  priTxt: { fontSize: 12, fontWeight: '700', color: '#495057' },
  priTxtActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#3b5bdb', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
