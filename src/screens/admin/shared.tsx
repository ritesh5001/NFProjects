import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme, AppTheme } from '../../theme/theme'

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const theme = useTheme()
  const s = adminStyles(theme)
  return (
    <View style={s.searchBar}>
      <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSubtle} />
      <TextInput
        style={s.searchInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSubtle}
        clearButtonMode="while-editing"
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')}>
          <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSubtle} />
        </TouchableOpacity>
      )}
    </View>
  )
}

export function DetailModal({
  visible, title, onClose, children,
}: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const theme = useTheme()
  const s = adminStyles(theme)
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export function KV({ label, value }: { label: string; value?: string | null }) {
  const theme = useTheme()
  const s = adminStyles(theme)
  if (!value) return null
  return (
    <View style={s.kvRow}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  )
}

export const adminStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.surfaceElevated, margin: 12, borderRadius: 12,
    paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: theme.colors.text },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  listContent: { padding: 12, paddingBottom: 90, gap: 8 },
  card: {
    backgroundColor: theme.colors.surfaceElevated, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: theme.colors.border, gap: 4, marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  cardSub: { fontSize: 12, color: theme.colors.textMuted },
  cardMeta: { fontSize: 11, color: theme.colors.textSubtle, marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: theme.colors.primarySoft },
  pillText: { fontSize: 10, color: theme.colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: theme.colors.textSubtle, fontSize: 13, paddingVertical: 40 },
  loading: { textAlign: 'center', color: theme.colors.textSubtle, fontSize: 13, paddingVertical: 40 },
  error: { backgroundColor: theme.colors.dangerSoft, color: theme.colors.danger, fontSize: 13, padding: 12, margin: 12, borderRadius: 8 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center', elevation: 6,
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  // modal + form
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
  modalBox: { backgroundColor: theme.colors.surfaceElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text, flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, padding: 12, fontSize: 14, color: theme.colors.text },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: theme.colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  kvRow: { flexDirection: 'row', gap: 10, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  kvLabel: { width: 110, fontSize: 12, color: theme.colors.textSubtle, fontWeight: '600' },
  kvValue: { flex: 1, fontSize: 13, color: theme.colors.text },
})
