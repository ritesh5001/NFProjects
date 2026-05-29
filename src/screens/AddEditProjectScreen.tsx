import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import { addClient } from '../api/clients';
import {
  AgencyStatus, AgencyPriority, getProject, createProject, updateProject, listMembers, AgencyMember,
} from '../api/projects';
import { formatDate } from '../utils/dateUtils';
import { useTheme, AppTheme } from '../theme/theme';

const STATUSES: { value: AgencyStatus; label: string }[] = [
  { value: 'kickoff', label: 'Kickoff' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'client_review', label: 'Client Review' },
  { value: 'revisions', label: 'Revisions' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITIES: { value: AgencyPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

function toDateInput(d: Date) { return d.toISOString().slice(0, 10); }

export default function AddEditProjectScreen({ route, navigation }: any) {
  const { projectId } = route.params ?? {};
  const { state, refreshProjects, refreshClients } = useAppContext();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(!!projectId);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<AgencyStatus>('kickoff');
  const [priority, setPriority] = useState<AgencyPriority>('medium');
  const [projectType, setProjectType] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; });
  const [hasDeadline, setHasDeadline] = useState(true);
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const [ncName, setNcName] = useState('');
  const [ncCompany, setNcCompany] = useState('');
  const [ncPhone, setNcPhone] = useState('');
  const [ncEmail, setNcEmail] = useState('');
  const [ncPassword, setNcPassword] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  useEffect(() => {
    listMembers().then(setMembers).catch(() => {});
  }, []);

  useEffect(() => {
    if (projectId) {
      getProject(projectId).then(p => {
        if (p) {
          setTitle(p.title);
          setStatus(p.status);
          setPriority(p.priority);
          setProjectType(p.project_type ?? '');
          setClientId(p.client_id ?? '');
          setClientName(p.client_name ?? '');
          if (p.start_date) setStartDate(new Date(p.start_date));
          if (p.deadline) { setDeadline(new Date(p.deadline)); setHasDeadline(true); } else setHasDeadline(false);
          setBudget(p.budget != null && p.budget > 0 ? String(p.budget) : '');
          setCurrency(p.currency || 'INR');
          setDescription(p.description ?? '');
          setNotes(p.notes ?? '');
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [projectId]);

  const selectedClient = state.clients.find(c => c.id === clientId);

  function toggleMember(id: string) {
    setSelectedMembers(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Validation', 'Project title is required.'); return; }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        client_id: clientId || null,
        client_name: (selectedClient?.name || clientName || 'Client').trim(),
        client_email: selectedClient?.email,
        client_company: selectedClient?.company,
        status,
        priority,
        project_type: projectType.trim(),
        start_date: toDateInput(startDate),
        deadline: hasDeadline ? toDateInput(deadline) : null,
        budget: budget ? parseFloat(budget) : undefined,
        currency,
        description: description.trim(),
        notes: notes.trim(),
      };
      if (projectId) {
        await updateProject(projectId, body);
      } else {
        await createProject({ ...body, member_ids: Array.from(selectedMembers) });
      }
      await refreshProjects();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  }

  function openClientModal() {
    setAddingClient(false);
    setNcName(''); setNcCompany(''); setNcPhone(''); setNcEmail(''); setNcPassword('');
    setShowClientModal(true);
  }

  async function handleAddClient() {
    if (!ncEmail.trim()) { Alert.alert('Validation', 'Email is required.'); return; }
    if (ncPassword.length < 8) { Alert.alert('Validation', 'Password must be at least 8 characters.'); return; }
    setSavingClient(true);
    try {
      const c = await addClient({
        name: ncName.trim(), company: ncCompany.trim(), phone: ncPhone.trim(),
        email: ncEmail.trim(), password: ncPassword,
      });
      await refreshClients();
      setClientId(c.id);
      setClientName(c.name);
      setShowClientModal(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not create client.');
    } finally {
      setSavingClient(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Project Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle}
        placeholder="e.g. Website Redesign for ABC" placeholderTextColor={theme.colors.textSubtle} />

      <Text style={styles.label}>Client account</Text>
      <TouchableOpacity style={styles.picker} onPress={openClientModal}>
        <Text style={clientId || clientName ? styles.pickerValue : styles.pickerPlaceholder}>
          {selectedClient ? (selectedClient.name || selectedClient.email) : clientName || 'Link or create a client'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textSubtle} />
      </TouchableOpacity>

      <Text style={styles.label}>Project Type</Text>
      <TextInput style={styles.input} value={projectType} onChangeText={setProjectType}
        placeholder="e.g. Web Development" placeholderTextColor={theme.colors.textSubtle} />

      <Text style={styles.label}>Status</Text>
      <View style={styles.segmentRow}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s.value} style={[styles.segment, status === s.value && styles.segmentActive]} onPress={() => setStatus(s.value)}>
            <Text style={[styles.segmentText, status === s.value && styles.segmentTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.segmentRow}>
        {PRIORITIES.map(p => (
          <TouchableOpacity key={p.value} style={[styles.segment, priority === p.value && styles.segmentActive]} onPress={() => setPriority(p.value)}>
            <Text style={[styles.segmentText, priority === p.value && styles.segmentTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.pickerValue}>{formatDate(startDate.getTime())}</Text>
            <MaterialCommunityIcons name="calendar" size={18} color={theme.colors.textSubtle} />
          </TouchableOpacity>
        </View>
        <View style={styles.dateField}>
          <Text style={styles.label}>Deadline</Text>
          <TouchableOpacity style={styles.picker} onPress={() => { setHasDeadline(true); setShowDeadlinePicker(true); }}>
            <Text style={hasDeadline ? styles.pickerValue : styles.pickerPlaceholder}>
              {hasDeadline ? formatDate(deadline.getTime()) : 'None'}
            </Text>
            <MaterialCommunityIcons name="calendar-clock" size={18} color={theme.colors.textSubtle} />
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker value={startDate} mode="date" display="default"
          onChange={(_, d) => { setShowStartPicker(false); if (d) setStartDate(d); }} />
      )}
      {showDeadlinePicker && (
        <DateTimePicker value={deadline} mode="date" display="default"
          onChange={(_, d) => { setShowDeadlinePicker(false); if (d) setDeadline(d); }} minimumDate={startDate} />
      )}

      <View style={styles.dateRow}>
        <View style={[styles.dateField, { flex: 2 }]}>
          <Text style={styles.label}>Budget</Text>
          <TextInput style={styles.input} value={budget} onChangeText={setBudget}
            placeholder="0" placeholderTextColor={theme.colors.textSubtle} keyboardType="numeric" />
        </View>
        <View style={[styles.dateField, { flex: 1 }]}>
          <Text style={styles.label}>Currency</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => {
              const i = CURRENCIES.indexOf(currency);
              setCurrency(CURRENCIES[(i + 1) % CURRENCIES.length]);
            }}
          >
            <Text style={styles.pickerValue}>{currency}</Text>
            <MaterialCommunityIcons name="cached" size={16} color={theme.colors.textSubtle} />
          </TouchableOpacity>
        </View>
      </View>

      {!projectId && members.length > 0 && (
        <>
          <Text style={styles.label}>Assign Team</Text>
          <View style={styles.segmentRow}>
            {members.map(m => {
              const sel = selectedMembers.has(m.id);
              return (
                <TouchableOpacity key={m.id} style={[styles.segment, sel && styles.segmentActive]} onPress={() => toggleMember(m.id)}>
                  <Text style={[styles.segmentText, sel && styles.segmentTextActive]}>{m.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription}
        placeholder="What is this project about? (visible to the client)" placeholderTextColor={theme.colors.textSubtle}
        multiline textAlignVertical="top" />

      <Text style={styles.label}>Internal Notes</Text>
      <TextInput style={[styles.input, styles.multiline]} value={notes} onChangeText={setNotes}
        placeholder="Internal notes (not shown to the client)" placeholderTextColor={theme.colors.textSubtle}
        multiline textAlignVertical="top" />

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        <LinearGradient colors={theme.gradients.primary} style={styles.saveBtnGradient}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Project</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={showClientModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {addingClient ? (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setAddingClient(false)} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>New Client Account</Text>
                </View>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput style={styles.input} value={ncName} onChangeText={setNcName} placeholder="e.g. Rahul Sharma" placeholderTextColor={theme.colors.textSubtle} />
                <Text style={styles.fieldLabel}>Company</Text>
                <TextInput style={styles.input} value={ncCompany} onChangeText={setNcCompany} placeholder="ABC Pvt. Ltd." placeholderTextColor={theme.colors.textSubtle} />
                <Text style={styles.fieldLabel}>Phone</Text>
                <TextInput style={styles.input} value={ncPhone} onChangeText={setNcPhone} placeholder="+91 98765 43210" placeholderTextColor={theme.colors.textSubtle} keyboardType="phone-pad" />
                <Text style={styles.fieldLabel}>Login email *</Text>
                <TextInput style={styles.input} value={ncEmail} onChangeText={setNcEmail} placeholder="client@example.com" placeholderTextColor={theme.colors.textSubtle} keyboardType="email-address" autoCapitalize="none" />
                <Text style={styles.fieldLabel}>Password * (min 8)</Text>
                <TextInput style={styles.input} value={ncPassword} onChangeText={setNcPassword} placeholder="Share with the client" placeholderTextColor={theme.colors.textSubtle} autoCapitalize="none" />
                <TouchableOpacity style={[styles.saveClientBtn, savingClient && { opacity: 0.6 }]} onPress={handleAddClient} disabled={savingClient}>
                  <LinearGradient colors={theme.gradients.primary} style={styles.saveClientBtnGradient}>
                    {savingClient ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveClientBtnText}>Create Client</Text>}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalClose} onPress={() => setShowClientModal(false)}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Client</Text>
                  <TouchableOpacity style={styles.addNewBtn} onPress={() => setAddingClient(true)}>
                    <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
                    <Text style={styles.addNewBtnText}>New</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.noClientRow} onPress={() => { setClientId(''); setClientName(''); setShowClientModal(false); }}>
                  <MaterialCommunityIcons name="account-off-outline" size={18} color={theme.colors.textSubtle} />
                  <Text style={styles.noClientText}>No client account</Text>
                </TouchableOpacity>
                <FlatList
                  data={state.clients}
                  keyExtractor={c => c.id}
                  style={styles.clientList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.clientItem, clientId === item.id && styles.clientItemActive]}
                      onPress={() => { setClientId(item.id); setClientName(item.name); setShowClientModal(false); }}
                    >
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientAvatarText}>{(item.name || item.email).charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientItemText}>{item.name || item.email}</Text>
                        {item.company ? <Text style={styles.clientItemSub}>{item.company}</Text> : null}
                      </View>
                      {clientId === item.id && <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <TouchableOpacity style={styles.emptyAddClient} onPress={() => setAddingClient(true)}>
                      <MaterialCommunityIcons name="account-plus-outline" size={32} color={theme.colors.textSubtle} />
                      <Text style={styles.emptyText}>No clients yet</Text>
                      <Text style={styles.emptyAddText}>Tap to create one</Text>
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
    backgroundColor: theme.colors.surfaceElevated, borderRadius: 10, borderWidth: 1,
    borderColor: theme.colors.border, padding: 12, fontSize: 14, color: theme.colors.text, marginBottom: 2,
  },
  multiline: { minHeight: 90, paddingTop: 10 },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segment: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated },
  segmentActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  segmentText: { fontSize: 13, color: theme.colors.textMuted },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, padding: 12,
  },
  pickerValue: { fontSize: 14, color: theme.colors.text },
  pickerPlaceholder: { fontSize: 14, color: theme.colors.textSubtle },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  saveBtn: { borderRadius: 12, marginTop: 24, overflow: 'hidden' },
  saveBtnGradient: { padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
  modalBox: { backgroundColor: theme.colors.surfaceElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  modalClose: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalCloseText: { color: theme.colors.danger, fontSize: 15, fontWeight: '600' },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  addNewBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  noClientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, marginBottom: 4 },
  noClientText: { fontSize: 14, color: theme.colors.textMuted },
  clientList: { maxHeight: 260 },
  clientItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, gap: 10 },
  clientItemActive: { backgroundColor: theme.colors.primarySoft, borderRadius: 8 },
  clientAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  clientAvatarText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  clientInfo: { flex: 1 },
  clientItemText: { fontSize: 14, color: theme.colors.text, fontWeight: '600' },
  clientItemSub: { fontSize: 12, color: theme.colors.textSubtle },
  emptyAddClient: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  emptyText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  emptyAddText: { color: theme.colors.textSubtle, fontSize: 12 },
  backBtn: { padding: 2 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 6, marginTop: 10 },
  saveClientBtn: { borderRadius: 12, marginTop: 16, overflow: 'hidden' },
  saveClientBtnGradient: { padding: 14, alignItems: 'center' },
  saveClientBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
