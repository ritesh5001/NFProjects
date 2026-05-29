import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl,
} from 'react-native';
import { confirmDelete } from '../utils/confirm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import { deleteClient, getClientProjectCount } from '../api/clients';
import EmptyState from '../components/EmptyState';
import { Client } from '../types';
import { useTheme, AppTheme } from '../theme/theme';

export default function ClientListScreen({ navigation }: any) {
  const { state, refreshClients } = useAppContext();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    refreshClients();
  }, [refreshClients]));

  useFocusEffect(useCallback(() => {
    async function loadCounts() {
      const counts: Record<string, number> = {};
      await Promise.all(
        state.clients.map(async c => {
          counts[c.id] = await getClientProjectCount(c.id);
        })
      );
      setProjectCounts(counts);
    }
    if (state.clients.length > 0) loadCounts();
  }, [state.clients]));

  function handleDelete(client: Client) {
    const count = projectCounts[client.id] ?? 0;
    const msg = count > 0
      ? `${client.name} has ${count} project(s). Deleting the client won't delete the projects.`
      : `Delete client "${client.name}"?`;
    confirmDelete('Delete Client', msg, async () => {
      await deleteClient(client.id);
      refreshClients();
    });
  }

  async function onRefresh() {
    setRefreshing(true);
    await refreshClients();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={state.clients}
        keyExtractor={c => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => navigation.navigate('AddEditClient', { clientId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.company ? <Text style={styles.sub}>{item.company}</Text> : null}
                <View style={styles.contactRow}>
                  {item.phone ? (
                    <Text style={styles.contact}>
                      <MaterialCommunityIcons name="phone" size={11} /> {item.phone}
                    </Text>
                  ) : null}
                  {item.email ? (
                    <Text style={styles.contact}>
                      <MaterialCommunityIcons name="email" size={11} /> {item.email}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.projectCount}>
                  {projectCounts[item.id] ?? 0} project(s)
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.textSubtle} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="account-group-outline"
            title="No clients yet"
            subtitle="Add your first client to link projects"
          />
        }
        contentContainerStyle={state.clients.length === 0 ? styles.emptyContainer : styles.listContent}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEditClient', {})}>
        <LinearGradient colors={theme.gradients.primary} style={styles.fabGradient}>
          <MaterialCommunityIcons name="account-plus" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: 12, paddingBottom: 80 },
  emptyContainer: { flex: 1 },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.22 : 0.06,
    shadowRadius: 3,
  },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  sub: { fontSize: 12, color: theme.colors.textMuted },
  contactRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  contact: { fontSize: 11, color: theme.colors.textSubtle },
  projectCount: { fontSize: 11, color: theme.colors.primary, fontWeight: '600', marginTop: 2 },
  deleteBtn: { padding: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
