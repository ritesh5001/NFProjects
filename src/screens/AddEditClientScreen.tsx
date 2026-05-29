import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getClient, addClient, updateClient } from '../api/clients';
import { useAppContext } from '../context/AppContext';
import { useTheme, AppTheme } from '../theme/theme';

export default function AddEditClientScreen({ route, navigation }: any) {
  const { clientId } = route.params ?? {};
  const { refreshClients } = useAppContext();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(!!clientId);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (clientId) {
      getClient(clientId).then(c => {
        if (c) { setName(c.name); setEmail(c.email); setPhone(c.phone); setCompany(c.company); }
        setLoading(false);
      });
    }
  }, [clientId]);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Validation', 'Client name is required.'); return; }
    if (!clientId) {
      if (!email.trim()) { Alert.alert('Validation', 'Email is required to create a client login.'); return; }
      if (password.length < 8) { Alert.alert('Validation', 'Set a login password of at least 8 characters.'); return; }
    }
    setSaving(true);
    try {
      if (clientId) {
        await updateClient(clientId, { name: name.trim(), email: email.trim(), phone: phone.trim(), company: company.trim() });
      } else {
        await addClient({ name: name.trim(), email: email.trim(), phone: phone.trim(), company: company.trim(), password });
      }
      await refreshClients();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save client', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save client.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {[
        { label: 'Name *', value: name, setter: setName, placeholder: 'Client name', keyboard: 'default' as const },
        { label: 'Company', value: company, setter: setCompany, placeholder: 'Company or business name', keyboard: 'default' as const },
        { label: 'Phone', value: phone, setter: setPhone, placeholder: '+91 98765 43210', keyboard: 'phone-pad' as const },
        { label: 'Email', value: email, setter: setEmail, placeholder: 'client@example.com', keyboard: 'email-address' as const },
      ].map(({ label, value, setter, placeholder, keyboard }) => (
        <View key={label}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setter}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSubtle}
            keyboardType={keyboard}
            autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
          />
        </View>
      ))}

      {!clientId && (
        <View>
          <Text style={styles.label}>Login password *</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={theme.colors.textSubtle}
            autoCapitalize="none"
          />
          <Text style={styles.hint}>The client uses their email + this password to log in to the portal.</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        <LinearGradient colors={theme.gradients.primary} style={styles.saveBtnGradient}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Client</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 6, marginTop: 14 },
  hint: { fontSize: 11, color: theme.colors.textSubtle, marginTop: 6 },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
  },
  saveBtn: {
    borderRadius: 12,
    marginTop: 28,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  saveBtnGradient: { padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
