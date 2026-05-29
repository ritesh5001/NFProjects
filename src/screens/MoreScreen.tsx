import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme, AppTheme } from '../theme/theme'

const SECTIONS: { screen: string; label: string; icon: string; sub: string }[] = [
  { screen: 'Contacts', label: 'Email Contacts', icon: 'account-multiple', sub: 'Your contact database' },
  { screen: 'Leads', label: 'B2B Leads', icon: 'briefcase-search', sub: 'Prospect pipeline' },
  { screen: 'Campaigns', label: 'Email Campaigns', icon: 'email-fast', sub: 'View campaign status' },
  { screen: 'Bookings', label: 'Booking Requests', icon: 'calendar-check', sub: 'Meetings & callbacks' },
  { screen: 'Chatbot', label: 'Chatbot Chats', icon: 'robot', sub: 'Website conversations' },
  { screen: 'Estimates', label: 'Estimator Leads', icon: 'calculator-variant', sub: 'Project estimates' },
  { screen: 'Forms', label: 'Form Submissions', icon: 'message-text', sub: 'Contact form messages' },
]

export default function MoreScreen({ navigation }: any) {
  const theme = useTheme()
  const styles = createStyles(theme)
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {SECTIONS.map((item) => (
        <TouchableOpacity key={item.screen} style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate(item.screen)}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name={item.icon as any} size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.sub}>{item.sub}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSubtle} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: 12, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.colors.surfaceElevated, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  label: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  sub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
})
