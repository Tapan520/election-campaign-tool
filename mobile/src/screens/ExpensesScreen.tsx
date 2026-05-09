import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExpenses, createExpense, ExpenseItem, EXPENSE_CATEGORIES } from '../api/expenses';

const CAT_COLOR: Record<string, string> = {
  Publicity: '#3b5bdb', Transport: '#f59f00', Food: '#e67700',
  Communication: '#7950f2', Printing: '#1971c2', Miscellaneous: '#868e96',
};

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Miscellaneous');
  const [payee, setPayee] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setExpenses(await getExpenses()); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const totalAmount = expenses.reduce((a, e) => a + e.amount, 0);

  const onSubmit = async () => {
    if (!desc.trim() || !amount.trim()) {
      Alert.alert('Error', 'Description and amount are required.');
      return;
    }
    setSaving(true);
    try {
      await createExpense({
        description: desc.trim(),
        category,
        amount: parseFloat(amount),
        expenseDate: new Date().toISOString(),
        payeeName: payee.trim() || undefined,
      });
      setShowForm(false);
      setDesc(''); setAmount(''); setPayee(''); setCategory('Miscellaneous');
      Alert.alert('Success', 'Expense recorded successfully.');
      load();
    } catch {
      Alert.alert('Error', 'Failed to save expense.');
    } finally { setSaving(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#3b5bdb" size="large" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Expenses</Text>
          <Text style={s.sub}>{expenses.length} records</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Total banner */}
      <View style={s.banner}>
        <View>
          <Text style={s.bannerLbl}>Total Expenses</Text>
          <Text style={s.bannerVal}>?{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={s.ecBadge}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#2f9e44" />
          <Text style={s.ecTxt}>
            {expenses.filter(e => e.isECCompliant).length} EC Compliant
          </Text>
        </View>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={e => e.id.toString()}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <View style={s.center}><Text style={{ color: '#868e96' }}>No expenses recorded.</Text></View>
        }
        renderItem={({ item: e }) => {
          const color = CAT_COLOR[e.category] ?? '#868e96';
          return (
            <View style={s.card}>
              <View style={[s.catDot, { backgroundColor: color }]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={s.cardTop}>
                  <Text style={s.cardDesc} numberOfLines={2}>{e.description}</Text>
                  <Text style={[s.amount, { color }]}>
                    ?{e.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={s.metaRow}>
                  <View style={[s.catBadge, { backgroundColor: color + '18' }]}>
                    <Text style={[s.catTxt, { color }]}>{e.category}</Text>
                  </View>
                  {e.isECCompliant && (
                    <Ionicons name="shield-checkmark-outline" size={14} color="#2f9e44" />
                  )}
                </View>
                <Text style={s.meta}>
                  ?? {new Date(e.expenseDate).toLocaleDateString('en-IN')}
                  {e.payeeName ? `  ·  ?? ${e.payeeName}` : ''}
                </Text>
                {e.voucherNumber && (
                  <Text style={s.voucher}>Voucher: {e.voucherNumber}</Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Add Expense Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Add Expense</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.fieldLabel}>Description *</Text>
              <TextInput style={s.input} value={desc} onChangeText={setDesc}
                placeholder="e.g. Printing banners" placeholderTextColor="#adb5bd" />

              <Text style={s.fieldLabel}>Amount (?) *</Text>
              <TextInput style={s.input} value={amount} onChangeText={setAmount}
                keyboardType="numeric" placeholder="0.00" placeholderTextColor="#adb5bd" />

              <Text style={s.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}>
                {EXPENSE_CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat}
                    style={[s.catOption, category === cat && s.catOptionActive]}
                    onPress={() => setCategory(cat)}>
                    <Text style={[s.catOptionTxt, category === cat && { color: '#fff' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.fieldLabel}>Payee Name</Text>
              <TextInput style={s.input} value={payee} onChangeText={setPayee}
                placeholder="Optional" placeholderTextColor="#adb5bd" />

              <TouchableOpacity style={s.saveBtn} onPress={onSubmit} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.saveTxt}>Save Expense</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={{ color: '#868e96', fontWeight: '600', textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addBtn: { backgroundColor: '#3b5bdb', borderRadius: 10, padding: 8 },
  banner: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  bannerLbl: { fontSize: 12, color: '#868e96' },
  bannerVal: { fontSize: 26, fontWeight: '800', color: '#212529' },
  ecBadge: { flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#d3f9d8', borderRadius: 8, padding: 8 },
  ecTxt: { fontSize: 12, color: '#2f9e44', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start', elevation: 1 },
  catDot: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 6 },
  cardDesc: { fontSize: 14, fontWeight: '600', color: '#212529', flex: 1, marginRight: 8 },
  amount: { fontSize: 16, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  catBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catTxt: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 11, color: '#868e96' },
  voucher: { fontSize: 11, color: '#adb5bd', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center',
    color: '#212529', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, padding: 12,
    fontSize: 14, color: '#212529', backgroundColor: '#f8f9fa', marginBottom: 12 },
  catOption: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  catOptionActive: { backgroundColor: '#3b5bdb', borderColor: '#3b5bdb' },
  catOptionTxt: { fontSize: 13, fontWeight: '600', color: '#495057' },
  saveBtn: { backgroundColor: '#3b5bdb', borderRadius: 10, padding: 14,
    alignItems: 'center', marginBottom: 8 },
  saveTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { padding: 12 },
});
