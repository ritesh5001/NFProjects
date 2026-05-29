import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import DeadlineChip from './DeadlineChip';
import { formatDate } from '../utils/dateUtils';
import { useTheme, AppTheme } from '../theme/theme';
import { AgencyProject, toTs } from '../api/projects';

interface Props {
  project: AgencyProject;
  onPress: () => void;
  onDelete?: () => void;
}

export default function ProjectCard({ project, onPress, onDelete }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const deadlineTs = toTs(project.deadline);

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
          <Text style={styles.metaText} numberOfLines={1}>
            {project.client_name || 'No client'}
            {project.project_type ? ` · ${project.project_type}` : ''}
          </Text>
          {deadlineTs != null && <DeadlineChip deadline={deadlineTs} status={project.status} />}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {deadlineTs != null ? `Deadline: ${formatDate(deadlineTs)}` : 'No deadline'}
        </Text>
        {project.budget != null && project.budget > 0 && (
          <Text style={styles.footerText}>
            {(project.currency || 'INR')} {project.budget.toLocaleString('en-IN')}
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
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 12, color: theme.colors.textMuted, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 11, color: theme.colors.textSubtle },
});
