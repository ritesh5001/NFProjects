import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import { confirmDelete } from '../utils/confirm';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import StatusBadge, { statusLabel } from '../components/StatusBadge';
import DeadlineChip from '../components/DeadlineChip';
import ProgressBar from '../components/ProgressBar';
import { formatDate } from '../utils/dateUtils';
import { useTheme, AppTheme } from '../theme/theme';
import {
  AgencyProject, AgencyStatus, getProject, deleteProject, setProjectStatus,
  addMilestone, setMilestoneCompleted, deleteMilestone, addUpdate, assignedMembers, toTs,
} from '../api/projects';

type Tab = 'overview' | 'milestones' | 'updates';

const STATUS_FLOW: AgencyStatus[] = ['kickoff', 'in_progress', 'client_review', 'revisions', 'delivered', 'on_hold', 'cancelled'];

export default function ProjectDetailScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const { refreshProjects } = useAppContext();
  const theme = useTheme();
  const styles = createStyles(theme);

  const [project, setProject] = useState<AgencyProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [newMilestone, setNewMilestone] = useState('');
  const [newUpdate, setNewUpdate] = useState('');

  const load = useCallback(async () => {
    const p = await getProject(projectId).catch(() => null);
    setProject(p);
    setLoading(false);
  }, [projectId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('AddEditProject', { projectId })} style={{ marginRight: 16 }}>
          <MaterialCommunityIcons name="pencil" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, projectId, theme.colors.primary]);

  async function changeStatus(status: AgencyStatus) {
    if (!project || busy) return;
    setBusy(true);
    try {
      await setProjectStatus(project.id, status);
      await refreshProjects();
      await load();
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    confirmDelete('Delete Project', 'This permanently deletes the project for everyone (website + app).', async () => {
      await deleteProject(projectId);
      await refreshProjects();
      navigation.goBack();
    });
  }

  async function handleAddMilestone() {
    if (!newMilestone.trim()) return;
    await addMilestone(projectId, { title: newMilestone.trim() });
    setNewMilestone('');
    load();
  }

  async function handleToggleMilestone(mid: string, completed: boolean) {
    await setMilestoneCompleted(projectId, mid, completed);
    load();
  }

  function handleDeleteMilestone(mid: string, title: string) {
    confirmDelete('Delete Milestone', `Remove "${title}"?`, async () => {
      await deleteMilestone(projectId, mid);
      load();
    });
  }

  async function handleAddUpdate() {
    if (!newUpdate.trim()) return;
    await addUpdate(projectId, newUpdate.trim());
    setNewUpdate('');
    load();
  }

  if (loading || !project) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  const milestones = project.project_milestones ?? [];
  const doneCount = milestones.filter(m => m.is_completed).length;
  const updates = project.project_updates ?? [];
  const references = project.project_references ?? [];
  const team = assignedMembers(project);
  const deadlineTs = toTs(project.deadline);
  const startTs = toTs(project.start_date);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={theme.gradients.surface} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.badges}>
              <StatusBadge status={project.status} />
              <View style={styles.typeChip}><Text style={styles.typeText}>{project.priority}</Text></View>
            </View>
            <TouchableOpacity onPress={handleDelete}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{project.title}</Text>
          {project.client_name ? <Text style={styles.clientName}>{project.client_name}</Text> : null}
          {deadlineTs != null && <DeadlineChip deadline={deadlineTs} status={project.status} />}
        </LinearGradient>

        {/* Status changer */}
        <View style={styles.statusStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusStripContent}>
            {STATUS_FLOW.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusPill, project.status === s && styles.statusPillActive]}
                onPress={() => changeStatus(s)}
                disabled={busy}
              >
                <Text style={[styles.statusPillText, project.status === s && styles.statusPillTextActive]}>{statusLabel(s)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.tabBar}>
          {(['overview', 'milestones', 'updates'] as Tab[]).map(tab => (
            <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'milestones' ? `Milestones${milestones.length ? ` (${doneCount}/${milestones.length})` : ''}` :
                  tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'overview' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <View style={styles.timelineRow}>
                <View style={styles.timelineItem}>
                  <MaterialCommunityIcons name="calendar-check" size={16} color={theme.colors.success} />
                  <Text style={styles.timelineLabel}>Start</Text>
                  <Text style={styles.timelineDate}>{startTs != null ? formatDate(startTs) : '—'}</Text>
                </View>
                <View style={styles.timelineLine} />
                <View style={styles.timelineItem}>
                  <MaterialCommunityIcons name="calendar-clock" size={16} color={theme.colors.primary} />
                  <Text style={styles.timelineLabel}>Deadline</Text>
                  <Text style={styles.timelineDate}>{deadlineTs != null ? formatDate(deadlineTs) : '—'}</Text>
                </View>
              </View>
            </View>

            {project.budget != null && project.budget > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Budget</Text>
                <Text style={styles.budgetValue}>{(project.currency || 'INR')} {project.budget.toLocaleString('en-IN')}</Text>
              </View>
            )}

            {milestones.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Progress</Text>
                <ProgressBar completed={doneCount} total={milestones.length} />
              </View>
            )}

            {project.description ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{project.description}</Text>
              </View>
            ) : null}

            {(project.client_email || project.client_phone || project.client_company) && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Client</Text>
                {project.client_company ? <Text style={styles.kv}>{project.client_company}</Text> : null}
                {project.client_email ? <Text style={styles.kvSub}>{project.client_email}</Text> : null}
                {project.client_phone ? <Text style={styles.kvSub}>{project.client_phone}</Text> : null}
              </View>
            )}

            {team.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Team</Text>
                <View style={styles.teamRow}>
                  {team.map(m => (
                    <View key={m.id} style={styles.teamChip}>
                      <View style={[styles.teamDot, { backgroundColor: m.avatar_color || theme.colors.primary }]} />
                      <Text style={styles.teamName}>{m.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {references.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>References</Text>
                {references.map(r => (
                  <TouchableOpacity key={r.id} style={styles.refRow} onPress={() => Linking.openURL(r.url).catch(() => {})}>
                    <MaterialCommunityIcons name="link-variant" size={16} color={theme.colors.primary} />
                    <Text style={styles.refText} numberOfLines={1}>{r.title || r.url}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'milestones' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  value={newMilestone}
                  onChangeText={setNewMilestone}
                  placeholder="Add a milestone..."
                  placeholderTextColor={theme.colors.textSubtle}
                  onSubmitEditing={handleAddMilestone}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddMilestone}>
                  <MaterialCommunityIcons name="plus" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              {milestones.length === 0 ? (
                <Text style={styles.emptyTabText}>No milestones yet. Add one above.</Text>
              ) : (
                milestones.map(m => (
                  <View key={m.id} style={styles.msRow}>
                    <TouchableOpacity onPress={() => handleToggleMilestone(m.id, !m.is_completed)} style={styles.msCheck}>
                      <MaterialCommunityIcons
                        name={m.is_completed ? 'check-circle' : 'checkbox-blank-circle-outline'}
                        size={22}
                        color={m.is_completed ? theme.colors.success : theme.colors.textSubtle}
                      />
                    </TouchableOpacity>
                    <Text style={[styles.msTitle, m.is_completed && styles.msTitleDone]}>{m.title}</Text>
                    <TouchableOpacity onPress={() => handleDeleteMilestone(m.id, m.title)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.textSubtle} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === 'updates' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  value={newUpdate}
                  onChangeText={setNewUpdate}
                  placeholder="Post an update..."
                  placeholderTextColor={theme.colors.textSubtle}
                  onSubmitEditing={handleAddUpdate}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddUpdate}>
                  <MaterialCommunityIcons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {updates.length === 0 ? (
                <Text style={styles.emptyTabText}>No updates yet.</Text>
              ) : (
                updates.map(u => (
                  <View key={u.id} style={styles.updateRow}>
                    <MaterialCommunityIcons name="circle-medium" size={18} color={theme.colors.primary} />
                    <View style={styles.updateBody}>
                      <Text style={styles.updateText}>{u.content}</Text>
                      <Text style={styles.updateDate}>{formatDate(new Date(u.created_at).getTime())}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  typeChip: { backgroundColor: theme.colors.violetSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  typeText: { fontSize: 11, color: theme.colors.violet, fontWeight: '600', textTransform: 'capitalize' },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  clientName: { fontSize: 13, color: theme.colors.textMuted },
  statusStrip: { backgroundColor: theme.colors.surfaceElevated, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  statusStripContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  statusPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  statusPillText: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
  statusPillTextActive: { color: '#fff', fontWeight: '700' },
  tabBar: { flexDirection: 'row', backgroundColor: theme.colors.surfaceElevated, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabBtnText: { fontSize: 12, color: theme.colors.textSubtle, fontWeight: '500' },
  tabBtnTextActive: { color: theme.colors.primary, fontWeight: '700' },
  section: { padding: 12, gap: 12 },
  card: {
    backgroundColor: theme.colors.surfaceElevated, borderRadius: 12, padding: 14, gap: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineItem: { flex: 1, alignItems: 'center', gap: 4 },
  timelineLine: { width: 24, height: 1, backgroundColor: theme.colors.border },
  timelineLabel: { fontSize: 10, color: theme.colors.textSubtle, textTransform: 'uppercase' },
  timelineDate: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  budgetValue: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  description: { fontSize: 14, color: theme.colors.textMuted, lineHeight: 20 },
  kv: { fontSize: 14, color: theme.colors.text, fontWeight: '600' },
  kvSub: { fontSize: 13, color: theme.colors.textMuted },
  teamRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  teamChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.surface, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: theme.colors.border },
  teamDot: { width: 10, height: 10, borderRadius: 5 },
  teamName: { fontSize: 12, color: theme.colors.text },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  refText: { fontSize: 13, color: theme.colors.primary, flex: 1 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  addInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, fontSize: 14, color: theme.colors.text, backgroundColor: theme.colors.surface },
  addBtn: { backgroundColor: theme.colors.primary, borderRadius: 8, width: 42, alignItems: 'center', justifyContent: 'center' },
  emptyTabText: { color: theme.colors.textSubtle, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  msRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  msCheck: {},
  msTitle: { flex: 1, fontSize: 14, color: theme.colors.text },
  msTitleDone: { color: theme.colors.textSubtle, textDecorationLine: 'line-through' },
  updateRow: { flexDirection: 'row', gap: 4, paddingVertical: 6 },
  updateBody: { flex: 1 },
  updateText: { fontSize: 14, color: theme.colors.text },
  updateDate: { fontSize: 11, color: theme.colors.textSubtle, marginTop: 2 },
});
