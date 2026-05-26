import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, AppTheme } from '../theme/theme';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon as any} size={56} color={theme.colors.textSubtle} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  title: { fontSize: 16, fontWeight: '600', color: theme.colors.textMuted, textAlign: 'center' },
  subtitle: { fontSize: 13, color: theme.colors.textSubtle, textAlign: 'center' },
});
