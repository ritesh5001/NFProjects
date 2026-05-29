import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { confirmDelete } from '../../utils/confirm'
import { useTheme } from '../../theme/theme'
import { adminStyles, SearchBar } from './shared'
import { DetailModal } from './shared'
import {
  Lead, LeadInput, LeadStatus, LEAD_STATUSES, leadStatusLabel,
  listLeads, createLead, updateLead, deleteLead,
} from '../../api/leads'

const EMPTY: LeadInput = { company_name: '', contact_name: '', email: '', phone: '', target_service: '', location: '', status: 'new', notes: '' }

export default function LeadsScreen() {
  const theme = useTheme()
  const s = adminStyles(theme)
  const [items, setItems] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('')
  const [editing, setEditing] = useState<Lead | null>(null)
  const [form, setForm] = useState<LeadInput>(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (query = q, status = statusFilter) => {
    setLoading(true); setError('')
    try { setItems(await listLeads(query, status)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }, [q, statusFilter])

  useFocusEffect(useCallback(() => { load('', '') }, []))

  function openNew() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(l: Lead) {
    setEditing(l)
    setForm({
      company_name: l.company_name, contact_name: l.contact_name ?? '', email: l.email ?? '',
      phone: l.phone ?? '', target_service: l.target_service ?? '', location: l.location ?? '',
      status: l.status, notes: l.notes ?? '',
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.company_name.trim()) { Alert.alert('Validation', 'Company name is required.'); return }
    setSaving(true)
    try {
      if (editing) await updateLead(editing.id, form)
      else await createLead(form)
      setShowForm(false); load()
    } catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  function remove(l: Lead) {
    confirmDelete('Delete Lead', `Delete ${l.company_name}?`, async () => { await deleteLead(l.id); load() })
  }

  function set<K extends keyof LeadInput>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  return (
    <View style={s.container}>
      <SearchBar value={q} onChange={setQ} placeholder="Search company, contact, email" />
      <View style={s.filterRow}>
        {(['', ...LEAD_STATUSES] as (LeadStatus | '')[]).map((st) => (
          <TouchableOpacity key={st || 'all'} style={[s.chip, statusFilter === st && s.chipActive]}
            onPress={() => { setStatusFilter(st); load(q, st) }}>
            <Text style={[s.chipText, statusFilter === st && s.chipTextActive]}>{st ? leadStatusLabel(st) : 'All'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} /> : (
        <FlatList
          data={items}
          keyExtractor={(l) => l.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => openEdit(item)} onLongPress={() => remove(item)} activeOpacity={0.7}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>{item.company_name}</Text>
                <View style={s.pill}><Text style={s.pillText}>{leadStatusLabel(item.status)}</Text></View>
              </View>
              {item.contact_name ? <Text style={s.cardSub}>{item.contact_name}</Text> : null}
              {(item.target_service || item.location) ? <Text style={s.cardMeta}>{[item.target_service, item.location].filter(Boolean).join(' · ')}</Text> : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={s.empty}>No leads yet.</Text>}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={openNew}>
        <LinearGradient colors={theme.gradients.primary} style={s.fabGradient}>
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <DetailModal visible={showForm} title={editing ? 'Edit Lead' : 'New Lead'} onClose={() => setShowForm(false)}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {([['Company *', 'company_name'], ['Contact name', 'contact_name'], ['Email', 'email'], ['Phone', 'phone'], ['Target service', 'target_service'], ['Location', 'location']] as const).map(([label, key]) => (
            <View key={key}>
              <Text style={s.label}>{label}</Text>
              <TextInput style={s.input} value={form[key] ?? ''} onChangeText={(v) => set(key, v)}
                autoCapitalize={key === 'email' ? 'none' : 'sentences'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'}
                placeholderTextColor={theme.colors.textSubtle} />
            </View>
          ))}
          <Text style={s.label}>Status</Text>
          <View style={s.filterRow}>
            {LEAD_STATUSES.map((st) => (
              <TouchableOpacity key={st} style={[s.chip, form.status === st && s.chipActive]} onPress={() => setForm((f) => ({ ...f, status: st }))}>
                <Text style={[s.chipText, form.status === st && s.chipTextActive]}>{leadStatusLabel(st)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>Notes</Text>
          <TextInput style={[s.input, s.multiline]} value={form.notes ?? ''} onChangeText={(v) => set('notes', v)} multiline placeholderTextColor={theme.colors.textSubtle} />
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Lead'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </DetailModal>
    </View>
  )
}
