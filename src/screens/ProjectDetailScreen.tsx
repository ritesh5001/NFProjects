import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { confirmDelete } from '../utils/confirm';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getProject, updateProject, deleteProject } from '../database/projects';
import { getTasksByProject, addTask, toggleTask, deleteTask } from '../database/tasks';
import { getNoteByProject, upsertNote } from '../database/notes';
import { getAttachments, addAttachment, deleteAttachment } from '../database/attachments';
import { cancelProjectReminders } from '../notifications/scheduler';
import { useAppContext } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import DeadlineChip from '../components/DeadlineChip';
import ProgressBar from '../components/ProgressBar';
import TaskItem from '../components/TaskItem';
import { Project, Task, Attachment, Note } from '../types';
import { formatDate, daysUntil } from '../utils/dateUtils';
import { useTheme, AppTheme } from '../theme/theme';
import { WEBSITE_CATEGORY_LABELS, WEBSITE_PLATFORM_LABELS } from '../utils/projectProgress';

const TYPE_LABELS: Record<string, string> = {
  website: 'Website', app: 'Mobile App', both: 'Web + App', other: 'Other',
};

type Tab = 'overview' | 'tasks' | 'notes' | 'files';

export default function ProjectDetailScreen({ route, navigation }: any) {
  const { projectId, initialTab } = route.params;
  const { refreshProjects } = useAppContext();
  const theme = useTheme();
  const styles = createStyles(theme);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [, setNote] = useState<Note | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(() => isTab(initialTab) ? initialTab : 'overview');
  const [newTask, setNewTask] = useState('');
  const [noteText, setNoteText] = useState('');
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [p, t, n, a] = await Promise.all([
      getProject(projectId),
      getTasksByProject(projectId),
      getNoteByProject(projectId),
      getAttachments(projectId),
    ]);
    setProject(p);
    setTasks(t);
    setNote(n);
    setNoteText(n?.body ?? '');
    setAttachments(a);
    setLoading(false);
  }, [projectId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (isTab(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEditProject', { projectId })}
          style={{ marginRight: 16 }}
        >
          <MaterialCommunityIcons name="pencil" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, projectId]);

  async function handleToggleStatus() {
    if (!project) return;
    const newStatus = project.status === 'completed' ? 'ongoing' : 'completed';
    await updateProject(project.id, { status: newStatus });
    await refreshProjects();
    load();
  }

  function handleDelete() {
    confirmDelete(
      'Delete Project',
      'This will permanently delete the project and all its data.',
      async () => {
        await cancelProjectReminders(projectId);
        await deleteProject(projectId);
        await refreshProjects();
        navigation.goBack();
      }
    );
  }

  async function handleAddTask() {
    if (!newTask.trim()) return;
    const t = await addTask(projectId, newTask.trim());
    setTasks(prev => [...prev, t]);
    setNewTask('');
  }

  async function handleToggleTask(id: string, completed: boolean) {
    await toggleTask(id, completed);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: completed } : t));
  }

  async function handleDeleteTask(id: string) {
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function handleNoteChange(text: string) {
    setNoteText(text);
    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(() => upsertNote(projectId, text), 800);
  }

  async function handlePickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Allow photo access in settings.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
      const att = await addAttachment(projectId, asset.uri, name, 'image');
      setAttachments(prev => [att, ...prev]);
    }
  }

  async function handlePickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const att = await addAttachment(projectId, asset.uri, asset.name, 'document');
      setAttachments(prev => [att, ...prev]);
    }
  }

  function handleDeleteAttachment(att: Attachment) {
    confirmDelete(
      'Delete File',
      `Remove "${att.file_name}"?`,
      async () => {
        await deleteAttachment(att.id, att.file_uri);
        setAttachments(prev => prev.filter(a => a.id !== att.id));
      }
    );
  }

  if (loading || !project) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const pending = project.budget_quoted - project.budget_received;
  const days = daysUntil(project.deadline);
  const categoryLabel = project.website_category ? WEBSITE_CATEGORY_LABELS[project.website_category] : '';
  const platformLabel = project.website_platform ? WEBSITE_PLATFORM_LABELS[project.website_platform] : '';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient colors={theme.gradients.surface} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.badges}>
              <StatusBadge status={project.status} />
              <View style={[styles.typeChip]}>
                <Text style={styles.typeText}>{TYPE_LABELS[project.type] ?? project.type}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleDelete}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{project.title}</Text>
          {project.client_name ? (
            <Text style={styles.clientName}>{project.client_name}</Text>
          ) : null}
          <DeadlineChip deadline={project.deadline} status={project.status} />
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['overview', 'tasks', 'notes', 'files'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'tasks' ? 'Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'tasks' && tasks.length > 0 ? ` (${completedTasks}/${tasks.length})` : ''}
                {tab === 'files' && attachments.length > 0 ? ` (${attachments.length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            {(categoryLabel || platformLabel) && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Website Setup</Text>
                <View style={styles.setupRow}>
                  {categoryLabel ? (
                    <View style={styles.setupChip}>
                      <MaterialCommunityIcons name="view-dashboard-outline" size={15} color={theme.colors.primary} />
                      <Text style={styles.setupChipText}>{categoryLabel}</Text>
                    </View>
                  ) : null}
                  {platformLabel ? (
                    <View style={styles.setupChip}>
                      <MaterialCommunityIcons name="tools" size={15} color={theme.colors.primary} />
                      <Text style={styles.setupChipText}>{platformLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <View style={styles.timelineRow}>
                <View style={styles.timelineItem}>
                  <MaterialCommunityIcons name="calendar-check" size={16} color={theme.colors.success} />
                  <Text style={styles.timelineLabel}>Got on</Text>
                  <Text style={styles.timelineDate}>{formatDate(project.start_date)}</Text>
                </View>
                <View style={styles.timelineLine} />
                <View style={styles.timelineItem}>
                  <MaterialCommunityIcons name="calendar-clock" size={16} color={days < 0 ? theme.colors.danger : days <= 3 ? theme.colors.warning : theme.colors.primary} />
                  <Text style={styles.timelineLabel}>Deadline</Text>
                  <Text style={[styles.timelineDate, days < 0 && { color: theme.colors.danger }]}>{formatDate(project.deadline)}</Text>
                </View>
              </View>
              {project.status !== 'completed' && (
                <Text style={[styles.daysLabel, days < 0 && { color: theme.colors.danger }]}>
                  {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today!' : `${days} days remaining`}
                </Text>
              )}
            </View>

            {project.budget_quoted > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Budget</Text>
                <View style={styles.budgetRow}>
                  <View style={styles.budgetItem}>
                    <Text style={styles.budgetValue}>₹{project.budget_quoted.toLocaleString('en-IN')}</Text>
                    <Text style={styles.budgetLabel}>Quoted</Text>
                  </View>
                  <View style={styles.budgetItem}>
                    <Text style={[styles.budgetValue, { color: theme.colors.success }]}>₹{project.budget_received.toLocaleString('en-IN')}</Text>
                    <Text style={styles.budgetLabel}>Received</Text>
                  </View>
                  <View style={styles.budgetItem}>
                    <Text style={[styles.budgetValue, pending > 0 ? { color: theme.colors.warning } : { color: theme.colors.success }]}>
                      {pending > 0 ? `₹${pending.toLocaleString('en-IN')}` : '✓ Paid'}
                    </Text>
                    <Text style={styles.budgetLabel}>Pending</Text>
                  </View>
                </View>
              </View>
            )}

            {tasks.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Project Progress</Text>
                <ProgressBar completed={completedTasks} total={tasks.length} />
              </View>
            )}

            {project.description ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{project.description}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.addTaskRow}>
                <TextInput
                  style={styles.taskInput}
                  value={newTask}
                  onChangeText={setNewTask}
                  placeholder="Add progress item..."
                  placeholderTextColor={theme.colors.textSubtle}
                  onSubmitEditing={handleAddTask}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addTaskBtn} onPress={handleAddTask}>
                  <MaterialCommunityIcons name="plus" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              {tasks.length === 0 ? (
                <Text style={styles.emptyTabText}>No progress items yet. Add one above.</Text>
              ) : (
                tasks.map(t => (
                  <TaskItem key={t.id} task={t} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
                ))
              )}
            </View>
          </View>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.autoSaveHint}>Auto-saved as you type</Text>
              <TextInput
                style={styles.notesInput}
                value={noteText}
                onChangeText={handleNoteChange}
                placeholder="Write notes about this project..."
                placeholderTextColor={theme.colors.textSubtle}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <View style={styles.section}>
            <View style={styles.attachBtns}>
              <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
                <MaterialCommunityIcons name="image-plus" size={20} color={theme.colors.primary} />
                <Text style={styles.attachBtnText}>Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachBtn} onPress={handlePickDocument}>
                <MaterialCommunityIcons name="file-plus" size={20} color={theme.colors.primary} />
                <Text style={styles.attachBtnText}>Add File</Text>
              </TouchableOpacity>
            </View>
            {attachments.length === 0 ? (
              <Text style={styles.emptyTabText}>No files attached yet.</Text>
            ) : (
              <View style={styles.attachGrid}>
                {attachments.map(att => (
                  <TouchableOpacity
                    key={att.id}
                    style={styles.attachItem}
                    onLongPress={() => handleDeleteAttachment(att)}
                    activeOpacity={0.8}
                  >
                    {att.file_type === 'image' ? (
                      <Image source={{ uri: att.file_uri }} style={styles.attachImage} />
                    ) : (
                      <View style={styles.docThumb}>
                        <MaterialCommunityIcons name="file-document" size={32} color={theme.colors.primary} />
                      </View>
                    )}
                    <Text style={styles.attachName} numberOfLines={1}>{att.file_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.statusBtn, project.status === 'completed' && styles.statusBtnReopen]}
          onPress={handleToggleStatus}
        >
          <LinearGradient
            colors={project.status === 'completed' ? theme.gradients.warningAction : theme.gradients.primary}
            style={styles.statusBtnGradient}
          >
            <MaterialCommunityIcons
              name={project.status === 'completed' ? 'refresh' : 'check-circle'}
              size={20}
              color="#fff"
            />
            <Text style={styles.statusBtnText}>
              {project.status === 'completed' ? 'Re-open Project' : 'Mark as Completed'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function isTab(value: unknown): value is Tab {
  return value === 'overview' || value === 'tasks' || value === 'notes' || value === 'files';
}


const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    padding: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  typeChip: {
    backgroundColor: theme.colors.violetSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeText: { fontSize: 11, color: theme.colors.violet, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  clientName: { fontSize: 13, color: theme.colors.textMuted },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabBtnText: { fontSize: 12, color: theme.colors.textSubtle, fontWeight: '500' },
  tabBtnTextActive: { color: theme.colors.primary, fontWeight: '700' },
  section: { padding: 12, gap: 12 },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.22 : 0.05,
    shadowRadius: 3,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  setupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  setupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  setupChipText: { fontSize: 12, color: theme.colors.primary, fontWeight: '700' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineItem: { flex: 1, alignItems: 'center', gap: 4 },
  timelineLine: { width: 24, height: 1, backgroundColor: theme.colors.border },
  timelineLabel: { fontSize: 10, color: theme.colors.textSubtle, textTransform: 'uppercase' },
  timelineDate: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  daysLabel: { fontSize: 13, color: theme.colors.primary, fontWeight: '600', textAlign: 'center' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-around' },
  budgetItem: { alignItems: 'center', gap: 4 },
  budgetValue: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  budgetLabel: { fontSize: 11, color: theme.colors.textSubtle },
  description: { fontSize: 14, color: theme.colors.textMuted, lineHeight: 20 },
  addTaskRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  taskInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  addTaskBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTabText: { color: theme.colors.textSubtle, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  autoSaveHint: { fontSize: 11, color: theme.colors.textSubtle, textAlign: 'right' },
  notesInput: {
    minHeight: 200,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  attachBtns: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 10,
    padding: 10,
    borderStyle: 'dashed',
  },
  attachBtnText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  attachItem: { width: '30%', alignItems: 'center', gap: 4 },
  attachImage: { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: theme.colors.surfaceMuted },
  docThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachName: { fontSize: 10, color: theme.colors.textMuted, textAlign: 'center' },
  bottomBar: {
    backgroundColor: theme.colors.surfaceElevated,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  statusBtn: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
  },
  statusBtnReopen: { shadowColor: theme.colors.warning },
  statusBtnGradient: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
