import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, AppTheme } from '../theme/theme';

interface Props {
  completed: number;
  total: number;
  showLabel?: boolean;
}

export default function ProgressBar({ completed, total, showLabel = true }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <LinearGradient colors={theme.gradients.primary} style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      {showLabel && (
        <Text style={styles.label}>{completed}/{total}</Text>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
  label: { fontSize: 11, color: theme.colors.textMuted, minWidth: 28, textAlign: 'right' },
});
