import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
      Alert.alert('Login Failed', 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Ionicons name="bar-chart" size={60} color="#f59f00" />
          <Text style={s.title}>Election Campaign Tool</Text>
          <Text style={s.sub}>India MLA & Ward Election Management</Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Email Address</Text>
          <View style={s.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#868e96" style={s.icon} />
            <TextInput style={s.input} value={email} onChangeText={setEmail}
              placeholder="you@election.com" placeholderTextColor="#adb5bd"
              autoCapitalize="none" keyboardType="email-address" />
          </View>

          <Text style={[s.label, { marginTop: 12 }]}>Password</Text>
          <View style={s.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#868e96" style={s.icon} />
            <TextInput style={s.input} value={password} onChangeText={setPassword}
              placeholder="��������" placeholderTextColor="#adb5bd"
              secureTextEntry={!showPass} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#868e96" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.demo}>
          <Text style={s.demoTitle}>Demo Accounts</Text>
          <Text style={s.demoLine}>admin@election.com / Admin@123</Text>
          <Text style={s.demoLine}>manager@election.com / Manager@123</Text>
          <Text style={s.demoLine}>worker@election.com / Worker@123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1f2e' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 12 },
  sub: { color: '#868e96', fontSize: 12, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#343a40', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: '#dee2e6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#f8f9fa' },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#212529' },
  btn: { backgroundColor: '#3b5bdb', borderRadius: 8, padding: 14,
    alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  demo: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 },
  demoTitle: { color: '#adb5bd', fontSize: 11, fontWeight: '700',
    textAlign: 'center', marginBottom: 6 },
  demoLine: { color: '#868e96', fontSize: 11, textAlign: 'center', lineHeight: 20 },
});
