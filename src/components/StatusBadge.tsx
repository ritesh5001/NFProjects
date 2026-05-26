import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProjectStatus } from '../types';
import { useTheme } from '../theme/theme';

const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  ongoing: { bg: '#E3F2FD', text: '#1565C0' },
  completed: { bg: '#E8F5E9', text: '#2E7D32' },
  paused: { bg: '#FFF8E1', text: '#F57F17' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  paused: 'Paused',
  cancelled: 'Cancelled',
};

interface Props {
  status: ProjectStatus;
}

export default function StatusBadge({ status }: Props) {
  const theme = useTheme();
  const colors = STATUS_COLORS[status];
  const backgroundColor = theme.isDark ? `${colors.text}33` : colors.bg;
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: colors.text }]}>{STATUS_LABELS[status]}</Text>
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
