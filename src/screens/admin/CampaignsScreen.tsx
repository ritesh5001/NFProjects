import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../theme/theme'
import { formatDate } from '../../utils/dateUtils'
import { adminStyles, DetailModal, KV } from './shared'
import { Campaign, listCampaigns } from '../../api/inbox'

export default function CampaignsScreen() {
  const theme = useTheme()
  const s = adminStyles(theme)
  const [items, setItems] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<Campaign | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setItems(await listCampaigns()) } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <View style={s.container}>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} /> : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[s.listContent, { paddingTop: 12 }]}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => setSel(item)} activeOpacity={0.7}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>{item.name}</Text>
                <View style={s.pill}><Text style={s.pillText}>{item.status}</Text></View>
              </View>
              <Text style={s.cardSub} numberOfLines={1}>{item.subject}</Text>
              <Text style={s.cardMeta}>{formatDate(new Date(item.created_at).getTime())}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={s.empty}>No campaigns. Create them on the website.</Text>}
        />
      )}
      <DetailModal visible={!!sel} title={sel?.name ?? ''} onClose={() => setSel(null)}>
        {sel && (
          <View>
            <KV label="Status" value={sel.status} />
            <KV label="Subject" value={sel.subject} />
            <KV label="From" value={sel.from_email} />
            <KV label="Created" value={formatDate(new Date(sel.created_at).getTime())} />
            {sel.description ? (
              <>
                <Text style={[s.label, { marginTop: 12 }]}>Description</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>{sel.description}</Text>
              </>
            ) : null}
            <Text style={{ color: theme.colors.textSubtle, fontSize: 12, marginTop: 16 }}>
              Editing, recipients and sending are managed on the website admin.
            </Text>
          </View>
        )}
      </DetailModal>
    </View>
  )
}
