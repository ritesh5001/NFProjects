import { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import { AgencyProject, toTs } from '../api/projects';
import { isOverdue, isDueThisWeek } from '../utils/dateUtils';
import { useTheme, AppTheme } from '../theme/theme';

const ACTIVE_STATUSES = ['kickoff', 'in_progress', 'client_review', 'revisions'];

function deadlineTs(p: AgencyProject): number {
  return toTs(p.deadline) ?? Number.MAX_SAFE_INTEGER;
}

export default function HomeScreen({ navigation }: any) {
  const { state, refreshProjects, refreshClients } = useAppContext();
  const theme = useTheme();
  const styles = createStyles(theme);

  useFocusEffect(useCallback(() => {
    refreshProjects();
    refreshClients();
  }, [refreshProjects, refreshClients]));

  const projects = state.projects;
  const active = projects.filter(p => ACTIVE_STATUSES.includes(p.status));
  const overdue = active.filter(p => { const ts = toTs(p.deadline); return ts != null && isOverdue(ts); });
  const dueThisWeek = active.filter(p => { const ts = toTs(p.deadline); return ts != null && isDueThisWeek(ts); });
  const needsAttention = active
    .filter(p => overdue.includes(p) || dueThisWeek.includes(p))
    .sort((a, b) => deadlineTs(a) - deadlineTs(b));
  const activeProjects = active
    .filter(p => !needsAttention.includes(p))
    .sort((a, b) => deadlineTs(a) - deadlineTs(b))
    .slice(0, 5);

  const stats = [
    { label: 'Total', value: projects.length, icon: 'briefcase', color: theme.colors.primary, gradient: theme.gradients.statBlue },
    { label: 'Active', value: active.length, icon: 'play-circle', color: theme.colors.success, gradient: theme.gradients.statGreen },
    { label: 'This Week', value: dueThisWeek.length, icon: 'calendar-week', color: theme.colors.warning, gradient: theme.gradients.statAmber },
    { label: 'Overdue', value: overdue.length, icon: 'alert-circle', color: theme.colors.danger, gradient: theme.gradients.statRose },
  ];

  function navToProject(projectId: string) {
    navigation.navigate('ProjectDetail', { projectId });
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refreshProjects} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
    >
      <Text style={styles.greeting}>Good {getTimeOfDay()}!</Text>
      <Text style={styles.subGreeting}>Here's your project overview</Text>

      <View style={styles.statsRow}>
        {stats.map(s => (
          <LinearGradient key={s.label} colors={s.gradient} style={styles.statCard}>
            <MaterialCommunityIcons name={s.icon as any} size={22} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </LinearGradient>
        ))}
      </View>

      {needsAttention.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="alert" size={16} color={theme.colors.danger} />
            <Text style={[styles.sectionTitle, { color: theme.colors.danger }]}>Needs Attention</Text>
          </View>
          {needsAttention.map(p => (
            <ProjectCard key={p.id} project={p} onPress={() => navToProject(p.id)} />
          ))}
        </>
      )}

      {activeProjects.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="briefcase-clock" size={16} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Active Projects</Text>
          </View>
          {activeProjects.map(p => (
            <ProjectCard key={p.id} project={p} onPress={() => navToProject(p.id)} />
          ))}
        </>
      )}

      {projects.length === 0 && (
        <View style={styles.emptyWrapper}>
          <EmptyState
            icon="briefcase-plus-outline"
            title="No projects yet"
            subtitle="Tap the + button to add your first project"
          />
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => navigation.navigate('ProjectsTab', { screen: 'AddEditProject', params: {} })}
          >
            <LinearGradient colors={theme.gradients.primary} style={styles.addFirstGradient}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addFirstBtnText}>Add First Project</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {active.length > 5 && (
        <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('ProjectsTab')}>
          <Text style={styles.viewAllText}>View all {active.length} active projects</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: 16, paddingBottom: 32 },
  greeting: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginTop: 4 },
  subGreeting: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  emptyWrapper: { alignItems: 'center', marginTop: 32, gap: 16 },
  addFirstBtn: { borderRadius: 12, overflow: 'hidden' },
  addFirstGradient: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8, alignItems: 'center' },
  addFirstBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, padding: 12 },
  viewAllText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
});
