import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../theme/theme'
import { formatDate } from '../../utils/dateUtils'
import { adminStyles, SearchBar, DetailModal, KV } from './shared'
import { ContactForm, listForms } from '../../api/inbox'

export default function FormsScreen() {
  const theme = useTheme()
  const s = adminStyles(theme)
  const [items, setItems] = useState<ContactForm[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<ContactForm | null>(null)

  const load = useCallback(async (query = '') => {
    setLoading(true)
    try { setItems(await listForms(query)) } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useFocusEffect(useCallback(() => { load('') }, [load]))

  return (
    <View style={s.container}>
      <SearchBar value={q} onChange={setQ} placeholder="Search name, email, message" />
      <TouchableOpacity style={{ marginHorizontal: 12, marginBottom: 4 }} onPress={() => load(q)}>
        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>Search</Text>
      </TouchableOpacity>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} /> : (
        <FlatList
          data={items}
          keyExtractor={(f) => f.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => setSel(item)} activeOpacity={0.7}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>{item.name}</Text>
                <View style={s.pill}><Text style={s.pillText}>{item.status}</Text></View>
              </View>
              <Text style={s.cardSub}>{item.email}</Text>
              <Text style={s.cardMeta} numberOfLines={1}>{item.message}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={s.empty}>No form submissions.</Text>}
        />
      )}
      <DetailModal visible={!!sel} title={sel?.name ?? ''} onClose={() => setSel(null)}>
        {sel && (
          <View>
            <KV label="Email" value={sel.email} />
            <KV label="Phone" value={sel.phone} />
            <KV label="Source" value={sel.information_source} />
            <KV label="Status" value={sel.status} />
            <KV label="Received" value={formatDate(new Date(sel.created_at).getTime())} />
            <Text style={[s.label, { marginTop: 14 }]}>Message</Text>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 20 }}>{sel.message}</Text>
          </View>
        )}
      </DetailModal>
    </View>
  )
}
