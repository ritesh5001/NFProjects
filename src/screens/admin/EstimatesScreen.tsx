import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../theme/theme'
import { formatDate } from '../../utils/dateUtils'
import { adminStyles, SearchBar, DetailModal, KV } from './shared'
import { EstimatorSubmission, listEstimates } from '../../api/inbox'

function money(n: number) { return `$${n.toLocaleString('en-US')}` }

export default function EstimatesScreen() {
  const theme = useTheme()
  const s = adminStyles(theme)
  const [items, setItems] = useState<EstimatorSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<EstimatorSubmission | null>(null)

  const load = useCallback(async (query = '') => {
    setLoading(true)
    try { setItems(await listEstimates(query)) } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useFocusEffect(useCallback(() => { load('') }, [load]))

  return (
    <View style={s.container}>
      <SearchBar value={q} onChange={setQ} placeholder="Search name, email, goals" />
      <TouchableOpacity style={{ marginHorizontal: 12, marginBottom: 4 }} onPress={() => load(q)}>
        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>Search</Text>
      </TouchableOpacity>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} /> : (
        <FlatList
          data={items}
          keyExtractor={(e) => e.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => setSel(item)} activeOpacity={0.7}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>{item.name}</Text>
                <Text style={s.cardSub}>{money(item.estimated_cost_min)}–{money(item.estimated_cost_max)}</Text>
              </View>
              <Text style={s.cardSub}>{item.project_type} · {item.email}</Text>
              <Text style={s.cardMeta} numberOfLines={1}>{item.goals}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={s.empty}>No estimator submissions.</Text>}
        />
      )}
      <DetailModal visible={!!sel} title={sel?.name ?? ''} onClose={() => setSel(null)}>
        {sel && (
          <View>
            <KV label="Estimate" value={`${money(sel.estimated_cost_min)} – ${money(sel.estimated_cost_max)}`} />
            <KV label="Timeline" value={`${sel.estimated_timeline_min_weeks}-${sel.estimated_timeline_max_weeks} weeks`} />
            <KV label="Confidence" value={sel.confidence} />
            <KV label="Type" value={sel.project_type} />
            <KV label="Email" value={sel.email} />
            <KV label="Phone" value={sel.phone} />
            <KV label="Company" value={sel.company_name} />
            <KV label="Received" value={formatDate(new Date(sel.created_at).getTime())} />
            <Text style={[s.label, { marginTop: 14 }]}>Goals</Text>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 20 }}>{sel.goals}</Text>
            {sel.estimate_summary ? (
              <>
                <Text style={[s.label, { marginTop: 14 }]}>Summary</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>{sel.estimate_summary}</Text>
              </>
            ) : null}
            {sel.next_step ? (
              <>
                <Text style={[s.label, { marginTop: 14 }]}>Next step</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>{sel.next_step}</Text>
              </>
            ) : null}
          </View>
        )}
      </DetailModal>
    </View>
  )
}
