import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabaseClient';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)).catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async () => {
    if (!email || !password) return Alert.alert('Missing info', 'Enter email and password');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
  };

  const signUp = async () => {
    if (!email || !password) return Alert.alert('Missing info', 'Enter email and password');
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert('Sign up failed', error.message);
    else Alert.alert('Success', 'Check your email to confirm your account');
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) Alert.alert('Sign out failed', error.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Auth</Text>
      <Text style={styles.subtitle}>{userId ? `Signed in as ${userId}` : 'Not signed in'}</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <View style={styles.row}>
        <TouchableOpacity onPress={signIn} disabled={loading} style={[styles.btn, styles.primary]}> 
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={signUp} disabled={loading} style={[styles.btn, styles.secondary]}> 
          <Text style={styles.btnText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={signOut} disabled={loading || !userId} style={[styles.btn, styles.outline]}> 
        <Text style={styles.btnText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, alignItems: 'stretch', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  btn: { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#1e90ff' },
  secondary: { backgroundColor: '#6cba5a' },
  outline: { backgroundColor: '#333' },
  btnText: { color: 'white', fontWeight: '600' },
});
