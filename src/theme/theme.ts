import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppContext } from '../context/AppContext';

export type AppThemeName = 'light' | 'dark';
export type AppThemePreference = 'system' | AppThemeName;

export type AppTheme = {
  name: AppThemeName;
  preference: AppThemePreference;
  isDark: boolean;
  colors: {
    background: string;
    backgroundAlt: string;
    surface: string;
    surfaceElevated: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    border: string;
    primary: string;
    primaryAlt: string;
    primarySoft: string;
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    danger: string;
    dangerSoft: string;
    violet: string;
    violetSoft: string;
    shadow: string;
    overlay: string;
    white: string;
  };
  gradients: {
    primary: [string, string, string];
    surface: [string, string];
    statBlue: [string, string];
    statGreen: [string, string];
    statAmber: [string, string];
    statRose: [string, string];
    warningAction: [string, string];
  };
};

const lightTheme: AppTheme = {
  name: 'light',
  preference: 'light',
  isDark: false,
  colors: {
    background: '#F6F8FC',
    backgroundAlt: '#EEF4FF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#F8FAFC',
    text: '#111827',
    textMuted: '#667085',
    textSubtle: '#98A2B3',
    border: '#E4E7EC',
    primary: '#5B5CF6',
    primaryAlt: '#06B6D4',
    primarySoft: '#EEF2FF',
    success: '#12B76A',
    successSoft: '#ECFDF3',
    warning: '#F79009',
    warningSoft: '#FFFAEB',
    danger: '#F04438',
    dangerSoft: '#FEF3F2',
    violet: '#8B5CF6',
    violetSoft: '#F4F3FF',
    shadow: '#101828',
    overlay: 'rgba(15, 23, 42, 0.45)',
    white: '#FFFFFF',
  },
  gradients: {
    primary: ['#6D5DF7', '#7C3AED', '#06B6D4'],
    surface: ['#FFFFFF', '#F7FAFF'],
    statBlue: ['#EEF2FF', '#E0F7FA'],
    statGreen: ['#ECFDF3', '#E6FFFA'],
    statAmber: ['#FFFAEB', '#FFF1E6'],
    statRose: ['#FFF1F2', '#FEF3F2'],
    warningAction: ['#FDB022', '#F97316'],
  },
};

const darkTheme: AppTheme = {
  name: 'dark',
  preference: 'dark',
  isDark: true,
  colors: {
    background: '#080B16',
    backgroundAlt: '#111827',
    surface: '#111827',
    surfaceElevated: '#172033',
    surfaceMuted: '#1F2937',
    text: '#F8FAFC',
    textMuted: '#CBD5E1',
    textSubtle: '#94A3B8',
    border: '#293548',
    primary: '#8B8CFF',
    primaryAlt: '#22D3EE',
    primarySoft: '#262A55',
    success: '#32D583',
    successSoft: '#103B2A',
    warning: '#FDB022',
    warningSoft: '#432B0B',
    danger: '#FF6B6B',
    dangerSoft: '#4A1D22',
    violet: '#A78BFA',
    violetSoft: '#2B214A',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.68)',
    white: '#FFFFFF',
  },
  gradients: {
    primary: ['#7C3AED', '#4F46E5', '#06B6D4'],
    surface: ['#182238', '#101827'],
    statBlue: ['#202A55', '#123A50'],
    statGreen: ['#123B2B', '#123A3D'],
    statAmber: ['#432B0B', '#3A2440'],
    statRose: ['#4A1D22', '#2E214A'],
    warningAction: ['#FDB022', '#EA580C'],
  },
};

export function getTheme(name: AppThemeName) {
  return name === 'dark' ? darkTheme : lightTheme;
}

export function useTheme() {
  const { state } = useAppContext();
  const systemScheme = useColorScheme();
  const resolvedTheme = state.theme === 'system'
    ? systemScheme === 'dark' ? 'dark' : 'light'
    : state.theme;

  return useMemo(() => ({
    ...getTheme(resolvedTheme),
    preference: state.theme,
  }), [resolvedTheme, state.theme]);
}
