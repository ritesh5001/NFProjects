import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  kickoff: { bg: '#E3F2FD', text: '#1565C0' },
  in_progress: { bg: '#FFF8E1', text: '#B7791F' },
  client_review: { bg: '#EDE7F6', text: '#6A1B9A' },
  revisions: { bg: '#FFF3E0', text: '#E65100' },
  delivered: { bg: '#E8F5E9', text: '#2E7D32' },
  on_hold: { bg: '#ECEFF1', text: '#546E7A' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
};

const STATUS_LABELS: Record<string, string> = {
  kickoff: 'Kickoff',
  in_progress: 'In Progress',
  client_review: 'Client Review',
  revisions: 'Revisions',
  delivered: 'Delivered',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const theme = useTheme();
  const colors = STATUS_COLORS[status] ?? { bg: '#ECEFF1', text: '#546E7A' };
  const backgroundColor = theme.isDark ? `${colors.text}33` : colors.bg;
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: colors.text }]}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
