import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { confirmDelete } from '../utils/confirm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import { deleteProject, toTs } from '../api/projects';
import { isOverdue } from '../utils/dateUtils';
import { useTheme, AppTheme } from '../theme/theme';

type FilterTab = 'all' | 'active' | 'overdue' | 'delivered' | 'on_hold';

const ACTIVE_STATUSES = ['kickoff', 'in_progress', 'client_review', 'revisions'];

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'on_hold', label: 'On Hold' },
];

export default function ProjectListScreen({ navigation }: any) {
  const { state, refreshProjects } = useAppContext();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { refreshProjects(); }, [refreshProjects]));

  const filtered = useMemo(() => {
    let list = state.projects;
    if (filter === 'active') {
      list = list.filter(p => ACTIVE_STATUSES.includes(p.status));
    } else if (filter === 'overdue') {
      list = list.filter(p => {
        const ts = toTs(p.deadline);
        return ACTIVE_STATUSES.includes(p.status) && ts != null && isOverdue(ts);
      });
    } else if (filter === 'delivered') {
      list = list.filter(p => p.status === 'delivered');
    } else if (filter === 'on_hold') {
      list = list.filter(p => p.status === 'on_hold');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.client_name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [state.projects, filter, search]);

  async function onRefresh() {
    setRefreshing(true);
    await refreshProjects();
    setRefreshing(false);
  }

  function handleDelete(id: string, title: string) {
    confirmDelete(
      'Delete Project',
      `Delete "${title}"? This removes it for everyone (website + app).`,
      async () => {
        await deleteProject(id);
        await refreshProjects();
      }
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSubtle} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search projects or clients..."
          placeholderTextColor={theme.colors.textSubtle}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSubtle} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, filter === tab.value && styles.tabActive]}
            onPress={() => setFilter(tab.value)}
          >
            <Text style={[styles.tabText, filter === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
            onDelete={() => handleDelete(item.id, item.title)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title={search ? 'No projects found' : 'No projects yet'}
            subtitle={search ? 'Try a different search' : 'Tap + to add your first project'}
          />
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditProject', {})}
      >
        <LinearGradient colors={theme.gradients.primary} style={styles.fabGradient}>
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: theme.colors.text },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  listContent: { paddingBottom: 80 },
  emptyContainer: { flex: 1, paddingBottom: 80 },
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
