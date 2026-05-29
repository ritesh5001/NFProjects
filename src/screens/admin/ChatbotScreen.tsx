import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../theme/theme'
import { formatDate } from '../../utils/dateUtils'
import { adminStyles, SearchBar, DetailModal, KV } from './shared'
import { ChatbotConversation, ChatbotMessage, listChatbot, getChatbot } from '../../api/inbox'

export default function ChatbotScreen() {
  const theme = useTheme()
  const s = adminStyles(theme)
  const [items, setItems] = useState<ChatbotConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<ChatbotConversation | null>(null)
  const [messages, setMessages] = useState<ChatbotMessage[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const load = useCallback(async (query = '') => {
    setLoading(true)
    try { setItems(await listChatbot(query)) } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useFocusEffect(useCallback(() => { load('') }, [load]))

  async function open(c: ChatbotConversation) {
    setSel(c); setMessages([]); setLoadingDetail(true)
    try {
      const detail = await getChatbot(c.id)
      setMessages(detail?.messages ?? [])
    } catch { /* ignore */ } finally { setLoadingDetail(false) }
  }

  return (
    <View style={s.container}>
      <SearchBar value={q} onChange={setQ} placeholder="Search name, email" />
      <TouchableOpacity style={{ marginHorizontal: 12, marginBottom: 4 }} onPress={() => load(q)}>
        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>Search</Text>
      </TouchableOpacity>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} /> : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => open(item)} activeOpacity={0.7}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>{item.name || item.email || 'Visitor'}</Text>
                <View style={s.pill}><Text style={s.pillText}>{item.status}</Text></View>
              </View>
              {item.last_user_message ? <Text style={s.cardMeta} numberOfLines={1}>“{item.last_user_message}”</Text> : null}
              <Text style={s.cardMeta}>{formatDate(new Date(item.created_at).getTime())}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={s.empty}>No conversations.</Text>}
        />
      )}
      <DetailModal visible={!!sel} title={sel?.name || sel?.email || 'Conversation'} onClose={() => setSel(null)}>
        {sel && (
          <View>
            <KV label="Email" value={sel.email} />
            <KV label="Phone" value={sel.phone} />
            <KV label="Company" value={sel.company_name} />
            <KV label="Status" value={sel.status} />
            {sel.ai_summary ? (
              <>
                <Text style={[s.label, { marginTop: 12 }]}>AI summary</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>{sel.ai_summary}</Text>
              </>
            ) : null}
            <Text style={[s.label, { marginTop: 14 }]}>Messages</Text>
            {loadingDetail ? <ActivityIndicator color={theme.colors.primary} /> : messages.map((m) => (
              <View key={m.id} style={{
                alignSelf: m.role === 'user' ? 'flex-start' : 'flex-end',
                backgroundColor: m.role === 'user' ? theme.colors.surface : theme.colors.primarySoft,
                borderRadius: 10, padding: 10, marginVertical: 4, maxWidth: '88%',
                borderWidth: 1, borderColor: theme.colors.border,
              }}>
                <Text style={{ fontSize: 13, color: theme.colors.text }}>{m.content}</Text>
              </View>
            ))}
          </View>
        )}
      </DetailModal>
    </View>
  )
}
