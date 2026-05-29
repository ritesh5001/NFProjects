import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { confirmDelete } from '../../utils/confirm'
import { useTheme } from '../../theme/theme'
import { adminStyles, SearchBar, DetailModal } from './shared'
import { Contact, ContactInput, listContacts, createContact, updateContact, deleteContact } from '../../api/contacts'

const EMPTY: ContactInput = { email: '', name: '', company: '', phone: '', industry: '', notes: '' }

export default function ContactsScreen() {
  const theme = useTheme()
  const s = adminStyles(theme)
  const [items, setItems] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState<ContactInput>(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (query = q) => {
    setLoading(true); setError('')
    try { setItems(await listContacts(query)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }, [q])

  useFocusEffect(useCallback(() => { load('') }, []))

  function openNew() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(c: Contact) {
    setEditing(c)
    setForm({ email: c.email, name: c.name ?? '', company: c.company ?? '', phone: c.phone ?? '', industry: c.industry ?? '', notes: c.notes ?? '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.email.trim()) { Alert.alert('Validation', 'Email is required.'); return }
    setSaving(true)
    try {
      if (editing) await updateContact(editing.id, form)
      else await createContact(form)
      setShowForm(false); load()
    } catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  function remove(c: Contact) {
    confirmDelete('Delete Contact', `Delete ${c.email}?`, async () => { await deleteContact(c.id); load() })
  }

  function set<K extends keyof ContactInput>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  return (
    <View style={s.container}>
      <SearchBar value={q} onChange={setQ} placeholder="Search email, name, company" />
      <TouchableOpacity style={{ marginHorizontal: 12, marginBottom: 4 }} onPress={() => load()}>
        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>Search</Text>
      </TouchableOpacity>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} /> : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => openEdit(item)} onLongPress={() => remove(item)} activeOpacity={0.7}>
              <Text style={s.cardTitle}>{item.name || item.email}</Text>
              <Text style={s.cardSub}>{item.email}</Text>
              {(item.company || item.phone) ? <Text style={s.cardMeta}>{[item.company, item.phone].filter(Boolean).join(' · ')}</Text> : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={s.empty}>No contacts yet.</Text>}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={openNew}>
        <LinearGradient colors={theme.gradients.primary} style={s.fabGradient}>
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <DetailModal visible={showForm} title={editing ? 'Edit Contact' : 'New Contact'} onClose={() => setShowForm(false)}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {([['Email *', 'email'], ['Name', 'name'], ['Company', 'company'], ['Phone', 'phone'], ['Industry', 'industry']] as const).map(([label, key]) => (
            <View key={key}>
              <Text style={s.label}>{label}</Text>
              <TextInput style={s.input} value={form[key] ?? ''} onChangeText={(v) => set(key, v)}
                autoCapitalize={key === 'email' ? 'none' : 'sentences'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'}
                placeholderTextColor={theme.colors.textSubtle} />
            </View>
          ))}
          <Text style={s.label}>Notes</Text>
          <TextInput style={[s.input, s.multiline]} value={form.notes ?? ''} onChangeText={(v) => set('notes', v)} multiline placeholderTextColor={theme.colors.textSubtle} />
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Contact'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </DetailModal>
    </View>
  )
}
