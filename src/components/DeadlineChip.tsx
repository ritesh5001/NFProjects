import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { deadlineLabel, isOverdue, daysUntil } from '../utils/dateUtils';
import { useTheme } from '../theme/theme';

interface Props {
  deadline: number;
  status: string;
}

export default function DeadlineChip({ deadline, status }: Props) {
  const theme = useTheme();
  if (status === 'completed' || status === 'cancelled') return null;

  const overdue = isOverdue(deadline);
  const urgent = !overdue && daysUntil(deadline) <= 3;
  const label = deadlineLabel(deadline);

  const bg = overdue ? theme.colors.dangerSoft : urgent ? theme.colors.warningSoft : theme.colors.primarySoft;
  const color = overdue ? theme.colors.danger : urgent ? theme.colors.warning : theme.colors.primary;

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});
