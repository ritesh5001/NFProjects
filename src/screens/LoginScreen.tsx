import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../context/AuthContext'
import { useTheme, AppTheme } from '../theme/theme'
import { ApiError } from '../api/client'

export default function LoginScreen() {
  const { login } = useAuth()
  const theme = useTheme()
  const styles = createStyles(theme)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!password.trim()) {
      setError('Enter the admin password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(password)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setError('Incorrect password.')
      else setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Admin Sign In</Text>
        <Text style={styles.subtitle}>Sign in to manage NextGen Fusion.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Admin password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={theme.colors.textSubtle}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={handleLogin}
          returnKeyType="go"
        />

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
          <LinearGradient colors={theme.gradients.primary} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
  },
  logo: { width: 140, height: 44, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4, marginBottom: 16 },
  error: {
    backgroundColor: theme.colors.dangerSoft,
    color: theme.colors.danger,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
  btn: { borderRadius: 12, marginTop: 20, overflow: 'hidden' },
  btnGradient: { padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
