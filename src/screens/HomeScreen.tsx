import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import DeadlineChip from '../components/DeadlineChip';
import ProgressBar from '../components/ProgressBar';
import { getTasksByProject } from '../database/tasks';
import { Project, Task } from '../types';
import { isOverdue, isDueThisWeek } from '../utils/dateUtils';
import { useTheme, AppTheme } from '../theme/theme';

type ProgressSummary = {
  completed: number;
  total: number;
  nextIncompleteTask?: string;
};

export default function HomeScreen({ navigation }: any) {
  const { state, refreshProjects, refreshClients } = useAppContext();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressSummary>>({});

  useFocusEffect(useCallback(() => {
    refreshProjects();
    refreshClients();
  }, [refreshProjects, refreshClients]));

  const projects = state.projects;
  const ongoing = projects.filter(p => p.status === 'ongoing');
  const overdue = ongoing.filter(p => isOverdue(p.deadline));
  const dueThisWeek = ongoing.filter(p => isDueThisWeek(p.deadline));
  const needsAttention = ongoing
    .filter(p => isOverdue(p.deadline) || dueThisWeek.includes(p))
    .sort((a, b) => a.deadline - b.deadline);
  const activeProjects = ongoing
    .filter(p => !needsAttention.includes(p))
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 5);
  const activeWebsiteProjects = useMemo(() => (
    projects.filter(p => p.status === 'ongoing' && (p.type === 'website' || p.type === 'both'))
  ), [projects]);
  const websiteProgressProjects = useMemo(() => (
    [...activeWebsiteProjects].sort(compareProjectPriority).slice(0, 3)
  ), [activeWebsiteProjects]);
  const activeWebsiteProjectIds = useMemo(() => (
    activeWebsiteProjects.map(project => project.id).join('|')
  ), [activeWebsiteProjects]);

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      if (activeWebsiteProjects.length === 0) {
        setProgressMap({});
        return;
      }

      const entries = await Promise.all(activeWebsiteProjects.map(async project => {
        const tasks = await getTasksByProject(project.id);
        return [project.id, summarizeTasks(tasks)] as const;
      }));

      if (mounted) {
        const nextMap = Object.fromEntries(entries);
        setProgressMap(prev => progressMapsEqual(prev, nextMap) ? prev : nextMap);
      }
    }

    loadProgress();

    return () => { mounted = false; };
  }, [activeWebsiteProjectIds]);

  const stats = [
    { label: 'Total', value: projects.length, icon: 'briefcase', color: theme.colors.primary, gradient: theme.gradients.statBlue },
    { label: 'Ongoing', value: ongoing.length, icon: 'play-circle', color: theme.colors.success, gradient: theme.gradients.statGreen },
    { label: 'This Week', value: dueThisWeek.length, icon: 'calendar-week', color: theme.colors.warning, gradient: theme.gradients.statAmber },
    { label: 'Overdue', value: overdue.length, icon: 'alert-circle', color: theme.colors.danger, gradient: theme.gradients.statRose },
  ];

  function navToProject(projectId: string) {
    navigation.navigate('ProjectDetail', { projectId });
  }

  function navToProjectProgress(projectId: string) {
    navigation.navigate('ProjectDetail', { projectId, initialTab: 'tasks' });
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refreshProjects} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
    >
      <Text style={styles.greeting}>Good {getTimeOfDay()}, Ritesh!</Text>
      <Text style={styles.subGreeting}>Here's your project overview</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {stats.map(s => (
          <LinearGradient key={s.label} colors={s.gradient} style={styles.statCard}>
            <MaterialCommunityIcons name={s.icon as any} size={22} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </LinearGradient>
        ))}
      </View>

      {websiteProgressProjects.length > 0 && (
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <View style={styles.widgetTitleRow}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={theme.colors.primary} />
              <Text style={styles.widgetTitle}>Website Progress</Text>
            </View>
            <Text style={styles.widgetMeta}>Top {websiteProgressProjects.length}</Text>
          </View>

          {websiteProgressProjects.map(project => {
            const progress = progressMap[project.id] ?? { completed: 0, total: 0 };
            const nextText = progress.total === 0
              ? 'No progress items yet'
              : progress.nextIncompleteTask
                ? `Next: ${progress.nextIncompleteTask}`
                : 'All progress items done';

            return (
              <TouchableOpacity
                key={project.id}
                style={styles.widgetRow}
                onPress={() => navToProjectProgress(project.id)}
                activeOpacity={0.78}
              >
                <View style={styles.widgetRowTop}>
                  <View style={styles.widgetProjectInfo}>
                    <Text style={styles.widgetProjectTitle} numberOfLines={1}>{project.title}</Text>
                    {project.client_name ? (
                      <Text style={styles.widgetClientName} numberOfLines={1}>{project.client_name}</Text>
                    ) : null}
                  </View>
                  <DeadlineChip deadline={project.deadline} status={project.status} />
                </View>
                <ProgressBar completed={progress.completed} total={progress.total} />
                <View style={styles.widgetNextRow}>
                  <Text
                    style={[
                      styles.widgetNextText,
                      progress.total > 0 && !progress.nextIncompleteTask && styles.widgetDoneText,
                    ]}
                    numberOfLines={1}
                  >
                    {nextText}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={theme.colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Needs Attention */}
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

      {/* Active Projects */}
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

      {ongoing.length > 5 && (
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('ProjectsTab')}
        >
          <Text style={styles.viewAllText}>View all {ongoing.length} active projects</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function summarizeTasks(tasks: Task[]): ProgressSummary {
  const completed = tasks.filter(task => task.is_completed).length;
  const nextIncompleteTask = tasks.find(task => !task.is_completed)?.title;

  return {
    completed,
    total: tasks.length,
    nextIncompleteTask,
  };
}

function progressMapsEqual(
  a: Record<string, ProgressSummary>,
  b: Record<string, ProgressSummary>,
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(key => (
    a[key]?.completed === b[key]?.completed &&
    a[key]?.total === b[key]?.total &&
    a[key]?.nextIncompleteTask === b[key]?.nextIncompleteTask
  ));
}

function compareProjectPriority(a: Project, b: Project) {
  const aRank = projectDeadlineRank(a);
  const bRank = projectDeadlineRank(b);

  if (aRank !== bRank) return aRank - bRank;
  return a.deadline - b.deadline;
}

function projectDeadlineRank(project: Project) {
  if (isOverdue(project.deadline)) return 0;
  if (isDueThisWeek(project.deadline)) return 1;
  return 2;
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
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '600' },
  widget: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.22 : 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  widgetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  widgetTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  widgetMeta: { fontSize: 11, color: theme.colors.textSubtle, fontWeight: '700', textTransform: 'uppercase' },
  widgetRow: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  widgetRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  widgetProjectInfo: { flex: 1, gap: 2 },
  widgetProjectTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
  widgetClientName: { fontSize: 12, color: theme.colors.textMuted },
  widgetNextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  widgetNextText: { flex: 1, fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' },
  widgetDoneText: { color: theme.colors.success },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  emptyWrapper: { alignItems: 'center', marginTop: 32, gap: 16 },
  addFirstBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addFirstGradient: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  addFirstBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    padding: 12,
  },
  viewAllText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
});
