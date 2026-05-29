import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../theme/theme'
import { formatDate } from '../../utils/dateUtils'
import { adminStyles, SearchBar, DetailModal, KV } from './shared'
import { BookingRequest, listBookings } from '../../api/inbox'

export default function BookingsScreen() {
  const theme = useTheme()
  const s = adminStyles(theme)
  const [items, setItems] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<BookingRequest | null>(null)

  const load = useCallback(async (query = '') => {
    setLoading(true)
    try { setItems(await listBookings(query)) } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useFocusEffect(useCallback(() => { load('') }, [load]))

  return (
    <View style={s.container}>
      <SearchBar value={q} onChange={setQ} placeholder="Search name or email" />
      <TouchableOpacity style={{ marginHorizontal: 12, marginBottom: 4 }} onPress={() => load(q)}>
        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>Search</Text>
      </TouchableOpacity>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} /> : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => setSel(item)} activeOpacity={0.7}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>{item.name}</Text>
                <View style={s.pill}><Text style={s.pillText}>{item.request_type}</Text></View>
              </View>
              <Text style={s.cardSub}>{item.email}{item.phone ? ` · ${item.phone}` : ''}</Text>
              <Text style={s.cardMeta}>{item.slot_label || (item.scheduled_at ? formatDate(new Date(item.scheduled_at).getTime()) : 'No slot')} · {item.status}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={s.empty}>No booking requests.</Text>}
        />
      )}
      <DetailModal visible={!!sel} title={sel?.name ?? ''} onClose={() => setSel(null)}>
        {sel && (
          <View>
            <KV label="Type" value={sel.request_type} />
            <KV label="Status" value={sel.status} />
            <KV label="Email" value={sel.email} />
            <KV label="Phone" value={sel.phone} />
            <KV label="Company" value={sel.company_name} />
            <KV label="Slot" value={sel.slot_label} />
            <KV label="Scheduled" value={sel.scheduled_at ? formatDate(new Date(sel.scheduled_at).getTime()) : null} />
            <KV label="Budget" value={sel.budget} />
            <KV label="Timeline" value={sel.timeline} />
            <KV label="Preferred time" value={sel.preferred_contact_time} />
            <KV label="Summary" value={sel.project_summary} />
            <KV label="Received" value={formatDate(new Date(sel.created_at).getTime())} />
          </View>
        )}
      </DetailModal>
    </View>
  )
}
