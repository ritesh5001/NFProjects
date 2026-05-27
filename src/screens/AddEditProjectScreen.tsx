import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getProject, addProject, updateProject } from '../database/projects';
import { addTask, getTasksByProject } from '../database/tasks';
import { addClient } from '../database/clients';
import { scheduleDeadlineReminders } from '../notifications/scheduler';
import { useAppContext } from '../context/AppContext';
import { ProjectType, ProjectStatus, WebsiteCategory, WebsitePlatform } from '../types';
import { formatDate } from '../utils/dateUtils';
import {
  getWebsiteChecklist,
  WEBSITE_CATEGORY_OPTIONS,
  WEBSITE_PLATFORM_OPTIONS,
} from '../utils/projectProgress';
import { useTheme, AppTheme } from '../theme/theme';

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'app', label: 'Mobile App' },
  { value: 'both', label: 'Web + App' },
  { value: 'other', label: 'Other' },
];

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AddEditProjectScreen({ route, navigation }: any) {
  const { projectId } = route.params ?? {};
  const { state, refreshProjects, refreshClients } = useAppContext();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(!!projectId);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProjectType>('website');
  const [status, setStatus] = useState<ProjectStatus>('ongoing');
  const [websiteCategory, setWebsiteCategory] = useState<WebsiteCategory>('ecommerce');
  const [websitePlatform, setWebsitePlatform] = useState<WebsitePlatform>('wordpress');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d;
  });
  const [budgetQuoted, setBudgetQuoted] = useState('');
  const [budgetReceived, setBudgetReceived] = useState('');
  const [description, setDescription] = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  useEffect(() => {
    if (projectId) {
      getProject(projectId).then(p => {
        if (p) {
          setTitle(p.title);
          setType(p.type);
          setStatus(p.status);
          if (p.website_category) setWebsiteCategory(p.website_category);
          if (p.website_platform) setWebsitePlatform(p.website_platform);
          setClientId(p.client_id);
          setStartDate(new Date(p.start_date));
          setDeadline(new Date(p.deadline));
          setBudgetQuoted(p.budget_quoted > 0 ? String(p.budget_quoted) : '');
          setBudgetReceived(p.budget_received > 0 ? String(p.budget_received) : '');
          setDescription(p.description);
        }
        setLoading(false);
      });
    }
  }, [projectId]);

  const selectedClient = state.clients.find(c => c.id === clientId);
  const isWebsiteProject = type === 'website' || type === 'both';
  const suggestedChecklist = getWebsiteChecklist(websiteCategory);

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Validation', 'Project title is required.'); return; }
    if (deadline <= startDate) { Alert.alert('Validation', 'Deadline must be after start date.'); return; }
    setSaving(true);
    try {
      const websiteCategoryValue: WebsiteCategory | '' = isWebsiteProject ? websiteCategory : '';
      const websitePlatformValue: WebsitePlatform | '' = isWebsiteProject ? websitePlatform : '';
      const data = {
        title: title.trim(),
        type,
        status,
        client_id: clientId,
        start_date: startDate.getTime(),
        deadline: deadline.getTime(),
        budget_quoted: parseFloat(budgetQuoted) || 0,
        budget_received: parseFloat(budgetReceived) || 0,
        website_category: websiteCategoryValue,
        website_platform: websitePlatformValue,
        description: description.trim(),
      };
      let savedProject;
      const isNewProject = !projectId;
      if (projectId) {
        await updateProject(projectId, data);
        savedProject = { id: projectId, ...data };
      } else {
        savedProject = await addProject(data);
      }
      const shouldCreateChecklist = isNewProject || (projectId && (await getTasksByProject(projectId)).length === 0);
      if (isWebsiteProject && shouldCreateChecklist) {
        for (const item of suggestedChecklist) {
          await addTask(savedProject.id, item);
        }
      }
      // notifications are best-effort; don't let them block the save
      scheduleDeadlineReminders(savedProject as any, state.notifSettings).catch(() => {});
      await refreshProjects();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save project. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function openClientModal() {
    setAddingClient(false);
    setNewClientName('');
    setNewClientCompany('');
    setNewClientPhone('');
    setNewClientEmail('');
    setShowClientModal(true);
  }

  async function handleAddClient() {
    if (!newClientName.trim()) { Alert.alert('Validation', 'Client name is required.'); return; }
    setSavingClient(true);
    try {
      const c = await addClient({
        name: newClientName.trim(),
        company: newClientCompany.trim(),
        phone: newClientPhone.trim(),
        email: newClientEmail.trim(),
      });
      await refreshClients();
      setClientId(c.id);
      setShowClientModal(false);
    } catch (error) {
      console.error('Could not save client', error);
      Alert.alert('Error', 'Could not save client.');
    } finally {
      setSavingClient(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Project Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. E-commerce Website for ABC"
        placeholderTextColor={theme.colors.textSubtle}
      />

      <Text style={styles.label}>Project Type</Text>
      <View style={styles.segmentRow}>
        {PROJECT_TYPES.map(pt => (
          <TouchableOpacity
            key={pt.value}
            style={[styles.segment, type === pt.value && styles.segmentActive]}
            onPress={() => setType(pt.value)}
          >
            <Text style={[styles.segmentText, type === pt.value && styles.segmentTextActive]}>
              {pt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isWebsiteProject && (
        <View style={styles.websiteBox}>
          <View style={styles.websiteHeader}>
            <MaterialCommunityIcons name="web" size={18} color={theme.colors.primary} />
            <Text style={styles.websiteTitle}>Website Details</Text>
          </View>

          <Text style={styles.label}>What is in the project?</Text>
          <View style={styles.segmentRow}>
            {WEBSITE_CATEGORY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.segment, websiteCategory === option.value && styles.segmentActive]}
                onPress={() => setWebsiteCategory(option.value)}
              >
                <Text style={[styles.segmentText, websiteCategory === option.value && styles.segmentTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Website Platform</Text>
          <View style={styles.segmentRow}>
            {WEBSITE_PLATFORM_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.segment, websitePlatform === option.value && styles.segmentActive]}
                onPress={() => setWebsitePlatform(option.value)}
              >
                <Text style={[styles.segmentText, websitePlatform === option.value && styles.segmentTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.checklistTitle}>Progress checklist</Text>
          <View style={styles.checklistPreview}>
            {suggestedChecklist.map(item => (
              <View key={item} style={styles.checklistPreviewItem}>
                <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={16} color={theme.colors.textSubtle} />
                <Text style={styles.checklistPreviewText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.helperText}>
            {projectId ? 'Edit progress from the Progress tab in project details.' : 'These items will be added to the Progress tab.'}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Client</Text>
      <TouchableOpacity style={styles.picker} onPress={openClientModal}>
        <Text style={clientId ? styles.pickerValue : styles.pickerPlaceholder}>
          {selectedClient ? selectedClient.name : 'Select or add client'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textSubtle} />
      </TouchableOpacity>

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.label}>Date Got Project *</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.pickerValue}>{formatDate(startDate.getTime())}</Text>
            <MaterialCommunityIcons name="calendar" size={18} color={theme.colors.textSubtle} />
          </TouchableOpacity>
        </View>
        <View style={styles.dateField}>
          <Text style={styles.label}>Deadline *</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowDeadlinePicker(true)}>
            <Text style={styles.pickerValue}>{formatDate(deadline.getTime())}</Text>
            <MaterialCommunityIcons name="calendar-clock" size={18} color={theme.colors.textSubtle} />
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(_, d) => { setShowStartPicker(false); if (d) setStartDate(d); }}
          maximumDate={deadline}
        />
      )}
      {showDeadlinePicker && (
        <DateTimePicker
          value={deadline}
          mode="date"
          display="default"
          onChange={(_, d) => { setShowDeadlinePicker(false); if (d) setDeadline(d); }}
          minimumDate={startDate}
        />
      )}

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.label}>Budget Quoted (₹)</Text>
          <TextInput
            style={styles.input}
            value={budgetQuoted}
            onChangeText={setBudgetQuoted}
            placeholder="0"
            placeholderTextColor={theme.colors.textSubtle}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.label}>Received (₹)</Text>
          <TextInput
            style={styles.input}
            value={budgetReceived}
            onChangeText={setBudgetReceived}
            placeholder="0"
            placeholderTextColor={theme.colors.textSubtle}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>Status</Text>
      <View style={styles.segmentRow}>
        {PROJECT_STATUSES.map(ps => (
          <TouchableOpacity
            key={ps.value}
            style={[styles.segment, status === ps.value && styles.segmentActive]}
            onPress={() => setStatus(ps.value)}
          >
            <Text style={[styles.segmentText, status === ps.value && styles.segmentTextActive]}>
              {ps.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description / Notes</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Project requirements, tech stack, special notes..."
        placeholderTextColor={theme.colors.textSubtle}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        <LinearGradient colors={theme.gradients.primary} style={styles.saveBtnGradient}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Project</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={showClientModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            {/* ── ADD CLIENT FORM ── */}
            {addingClient ? (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setAddingClient(false)} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>New Client</Text>
                </View>

                <Text style={styles.fieldLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newClientName}
                  onChangeText={setNewClientName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={theme.colors.textSubtle}
                  autoFocus
                />

                <Text style={styles.fieldLabel}>Company</Text>
                <TextInput
                  style={styles.input}
                  value={newClientCompany}
                  onChangeText={setNewClientCompany}
                  placeholder="e.g. ABC Pvt. Ltd."
                  placeholderTextColor={theme.colors.textSubtle}
                />

                <Text style={styles.fieldLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={newClientPhone}
                  onChangeText={setNewClientPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={theme.colors.textSubtle}
                  keyboardType="phone-pad"
                />

                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={newClientEmail}
                  onChangeText={setNewClientEmail}
                  placeholder="client@example.com"
                  placeholderTextColor={theme.colors.textSubtle}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={[styles.saveClientBtn, savingClient && { opacity: 0.6 }]}
                  onPress={handleAddClient}
                  disabled={savingClient}
                >
                  <LinearGradient colors={theme.gradients.primary} style={styles.saveClientBtnGradient}>
                    {savingClient
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.saveClientBtnText}>Save Client</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalClose} onPress={() => setShowClientModal(false)}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── SELECT CLIENT LIST ── */
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Client</Text>
                  <TouchableOpacity style={styles.addNewBtn} onPress={() => setAddingClient(true)}>
                    <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
                    <Text style={styles.addNewBtnText}>New</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.noClientRow}
                  onPress={() => { setClientId(''); setShowClientModal(false); }}
                >
                  <MaterialCommunityIcons name="account-off-outline" size={18} color={theme.colors.textSubtle} />
                  <Text style={styles.noClientText}>No Client</Text>
                </TouchableOpacity>

                <FlatList
                  data={state.clients}
                  keyExtractor={c => c.id}
                  style={styles.clientList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.clientItem, clientId === item.id && styles.clientItemActive]}
                      onPress={() => { setClientId(item.id); setShowClientModal(false); }}
                    >
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientItemText}>{item.name}</Text>
                        {item.company ? <Text style={styles.clientItemSub}>{item.company}</Text> : null}
                        {item.phone ? <Text style={styles.clientItemSub}>{item.phone}</Text> : null}
                      </View>
                      {clientId === item.id && (
                        <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <TouchableOpacity style={styles.emptyAddClient} onPress={() => setAddingClient(true)}>
                      <MaterialCommunityIcons name="account-plus-outline" size={32} color={theme.colors.textSubtle} />
                      <Text style={styles.emptyText}>No clients yet</Text>
                      <Text style={styles.emptyAddText}>Tap to add your first client</Text>
                    </TouchableOpacity>
                  }
                />

                <TouchableOpacity style={styles.modalClose} onPress={() => setShowClientModal(false)}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 2,
  },
  multiline: { minHeight: 96, paddingTop: 10 },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
  },
  segmentActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  segmentText: { fontSize: 13, color: theme.colors.textMuted },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  websiteBox: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginTop: 16,
  },
  websiteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  websiteTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  checklistTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
  checklistPreview: { gap: 7 },
  checklistPreviewItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checklistPreviewText: { fontSize: 13, color: theme.colors.textMuted, flex: 1 },
  helperText: { fontSize: 12, color: theme.colors.textSubtle, marginTop: 10, lineHeight: 17 },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
  },
  pickerValue: { fontSize: 14, color: theme.colors.text },
  pickerPlaceholder: { fontSize: 14, color: theme.colors.textSubtle },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  saveBtn: {
    borderRadius: 12,
    marginTop: 24,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
  saveBtnGradient: { padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: theme.colors.surfaceElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  // modal — shared
  modalTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  modalClose: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalCloseText: { color: theme.colors.danger, fontSize: 15, fontWeight: '600' },

  // select list mode
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  addNewBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  noClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    marginBottom: 4,
  },
  noClientText: { fontSize: 14, color: theme.colors.textMuted },
  clientList: { maxHeight: 280 },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: 10,
  },
  clientItemActive: { backgroundColor: theme.colors.primarySoft, borderRadius: 8 },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  clientInfo: { flex: 1 },
  clientItemText: { fontSize: 14, color: theme.colors.text, fontWeight: '600' },
  clientItemSub: { fontSize: 12, color: theme.colors.textSubtle },
  emptyAddClient: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  emptyText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  emptyAddText: { color: theme.colors.textSubtle, fontSize: 12 },

  // add client form mode
  backBtn: { padding: 2 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 6, marginTop: 10 },
  saveClientBtn: {
    borderRadius: 12,
    marginTop: 16,
    overflow: 'hidden',
  },
  saveClientBtnGradient: { padding: 14, alignItems: 'center' },
  saveClientBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
