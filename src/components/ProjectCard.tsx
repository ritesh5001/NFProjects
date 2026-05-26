import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Project } from '../types';
import StatusBadge from './StatusBadge';
import DeadlineChip from './DeadlineChip';
import ProgressBar from './ProgressBar';
import { formatDate } from '../utils/dateUtils';
import { useTheme, AppTheme } from '../theme/theme';

interface Props {
  project: Project;
  taskStats?: { completed: number; total: number };
  onPress: () => void;
  onDelete?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  website: 'Website',
  app: 'Mobile App',
  both: 'Web + App',
  other: 'Other',
};

export default function ProjectCard({ project, taskStats, onPress, onDelete }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const pending = project.budget_quoted - project.budget_received;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
          <View style={styles.titleActions}>
            <StatusBadge status={project.status} />
            {onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.deleteBtn}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={17} color={theme.colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {project.client_name || 'No client'} · {TYPE_LABELS[project.type] || project.type}
          </Text>
          <DeadlineChip deadline={project.deadline} status={project.status} />
        </View>
      </View>

      {taskStats && taskStats.total > 0 && (
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <ProgressBar completed={taskStats.completed} total={taskStats.total} />
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Deadline: {formatDate(project.deadline)}</Text>
        {project.budget_quoted > 0 && (
          <Text style={[styles.footerText, pending > 0 && styles.pendingText]}>
            {pending > 0 ? `₹${pending.toLocaleString('en-IN')} pending` : 'Paid ✓'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.22 : 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  header: { gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  titleActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  deleteBtn: { padding: 2 },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors.text, flex: 1 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: 12, color: theme.colors.textMuted, flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLabel: { fontSize: 11, color: theme.colors.textSubtle, width: 52 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 11, color: theme.colors.textSubtle },
  pendingText: { color: theme.colors.warning, fontWeight: '600' },
});
