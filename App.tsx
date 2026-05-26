import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runMigrations } from './src/database/db';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useTheme } from './src/theme/theme';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDbReady(true), 15000);
    runMigrations()
      .then(() => { clearTimeout(timeout); setDbReady(true); })
      .catch(err => { clearTimeout(timeout); console.error('DB migration failed', err); setDbReady(true); });
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
