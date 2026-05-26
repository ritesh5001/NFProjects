import React from 'react';
import {
  View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemePreference, useAppContext } from '../context/AppContext';
import { NotificationSettings } from '../types';
import { requestNotificationPermission } from '../notifications/scheduler';
import { useTheme, AppTheme } from '../theme/theme';

export default function SettingsScreen() {
  const { state, dispatch } = useAppContext();
  const { notifSettings, theme } = state;
  const appTheme = useTheme();
  const styles = createStyles(appTheme);

  async function updateNotifSettings(patch: Partial<NotificationSettings>) {
    const updated = { ...notifSettings, ...patch };
    if (patch.enabled && !notifSettings.enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Enable notifications in Android settings to use this feature.');
        return;
      }
    }
    dispatch({ type: 'SET_NOTIF_SETTINGS', payload: updated });
    await AsyncStorage.setItem('notifSettings', JSON.stringify(updated));
  }

  async function updateTheme(next: ThemePreference) {
    dispatch({ type: 'SET_THEME', payload: next });
    await AsyncStorage.setItem('theme', next);
  }

  const themeOptions: { value: ThemePreference; label: string; detail: string; icon: string }[] = [
    { value: 'system', label: 'System', detail: `Uses device setting, now ${appTheme.name}`, icon: 'theme-light-dark' },
    { value: 'light', label: 'Light', detail: 'Premium bright SaaS palette', icon: 'weather-sunny' },
    { value: 'dark', label: 'Dark', detail: 'Deep modern SaaS palette', icon: 'weather-night' },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.section}>Notifications</Text>
      <View style={styles.card}>
        <Row
          icon="bell"
          label="Enable Reminders"
          right={<Switch value={notifSettings.enabled} onValueChange={v => updateNotifSettings({ enabled: v })} trackColor={{ true: appTheme.colors.primary, false: appTheme.colors.surfaceMuted }} thumbColor={notifSettings.enabled ? appTheme.colors.primaryAlt : appTheme.colors.textSubtle} />}
        />
        {notifSettings.enabled && (
          <>
            <Row
              icon="calendar-week"
              label="7 days before deadline"
              right={<Switch value={notifSettings.remind7Days} onValueChange={v => updateNotifSettings({ remind7Days: v })} trackColor={{ true: appTheme.colors.primary, false: appTheme.colors.surfaceMuted }} />}
            />
            <Row
              icon="calendar-today"
              label="3 days before deadline"
              right={<Switch value={notifSettings.remind3Days} onValueChange={v => updateNotifSettings({ remind3Days: v })} trackColor={{ true: appTheme.colors.primary, false: appTheme.colors.surfaceMuted }} />}
            />
            <Row
              icon="bell-ring"
              label="1 day before deadline"
              right={<Switch value={notifSettings.remind1Day} onValueChange={v => updateNotifSettings({ remind1Day: v })} trackColor={{ true: appTheme.colors.primary, false: appTheme.colors.surfaceMuted }} />}
            />
          </>
        )}
      </View>

      <Text style={styles.section}>Appearance</Text>
      <View style={styles.card}>
        <Row
          icon={theme === 'system' ? 'theme-light-dark' : theme === 'dark' ? 'weather-night' : 'weather-sunny'}
          label={`Theme: ${theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}`}
          value={theme === 'system' ? `Currently ${appTheme.name}` : undefined}
        />
        <View style={styles.themeOptions}>
          {themeOptions.map(option => {
            const active = theme === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.themeOption, active && styles.themeOptionActive]}
                onPress={() => updateTheme(option.value)}
                activeOpacity={0.78}
              >
                <View style={[styles.themeOptionIcon, active && styles.themeOptionIconActive]}>
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={18}
                    color={active ? appTheme.colors.white : appTheme.colors.primary}
                  />
                </View>
                <View style={styles.themeOptionCopy}>
                  <Text style={[styles.themeOptionTitle, active && styles.themeOptionTitleActive]}>
                    {option.label}
                  </Text>
                  <Text style={styles.themeOptionSub}>{option.detail}</Text>
                </View>
                {active && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={appTheme.colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={styles.section}>About</Text>
      <View style={styles.card}>
        <Row icon="briefcase" label="NF Projects" value="v1.0.0" />
        <Row icon="web" label="NextGen Fusion" value="nextgenfusion.in" />
        <Row icon="code-tags" label="Built with Expo + React Native" />
      </View>
    </ScrollView>
  );
}

function Row({ icon, label, value, right }: { icon: string; label: string; value?: string; right?: React.ReactNode }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon as any} size={20} color={theme.colors.textMuted} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {right}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: 16, paddingBottom: 40 },
  section: { fontSize: 12, fontWeight: '700', color: theme.colors.textSubtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.22 : 0.05,
    shadowRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  rowIcon: { width: 24 },
  rowLabel: { flex: 1, fontSize: 14, color: theme.colors.text },
  rowValue: { fontSize: 13, color: theme.colors.textSubtle },
  themeOptions: { padding: 12, gap: 8 },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  themeOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  themeOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  themeOptionIconActive: { backgroundColor: theme.colors.primary },
  themeOptionCopy: { flex: 1, gap: 2 },
  themeOptionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  themeOptionTitleActive: { color: theme.colors.primary },
  themeOptionSub: { fontSize: 12, color: theme.colors.textSubtle },
});
