import { api } from './client'

export type AgencyStatus =
  | 'kickoff' | 'in_progress' | 'client_review' | 'revisions' | 'delivered' | 'on_hold' | 'cancelled'
export type AgencyPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Milestone {
  id: string
  title: string
  description?: string | null
  due_date?: string | null
  is_completed: boolean
  completed_at?: string | null
}

export interface ProjectUpdate {
  id: string
  content: string
  update_type: string
  created_at: string
  agency_members?: { id: string; name: string } | { id: string; name: string }[] | null
}

export interface ProjectReference {
  id: string
  type: string
  title: string
  url: string
  notes?: string | null
}

export interface AssignmentMember {
  id: string
  name: string
  avatar_color?: string
}

export interface ProjectAssignment {
  role: string
  agency_members: AssignmentMember | AssignmentMember[] | null
}

export interface AgencyProject {
  id: string
  title: string
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  client_company?: string | null
  client_website?: string | null
  client_id?: string | null
  status: AgencyStatus
  priority: AgencyPriority
  project_type?: string | null
  start_date?: string | null
  deadline?: string | null
  delivered_date?: string | null
  budget?: number | null
  currency?: string
  description?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  project_assignments?: ProjectAssignment[]
  project_milestones?: Milestone[]
  project_updates?: ProjectUpdate[]
  project_references?: ProjectReference[]
}

export interface AgencyMember {
  id: string
  name: string
  avatar_color: string
  is_active: boolean
}

// agency dates are ISO date strings; convert to epoch for the date helpers/components.
export function toTs(d?: string | null): number | null {
  return d ? new Date(d).getTime() : null
}

export function assignedMembers(p: AgencyProject): AssignmentMember[] {
  const out: AssignmentMember[] = []
  for (const a of p.project_assignments ?? []) {
    if (!a.agency_members) continue
    if (Array.isArray(a.agency_members)) out.push(...a.agency_members)
    else out.push(a.agency_members)
  }
  return out
}

export async function getProjects(): Promise<AgencyProject[]> {
  const json = await api.get<{ data: AgencyProject[] }>('/api/agency/projects')
  return json.data ?? []
}

export async function getProject(id: string): Promise<AgencyProject | null> {
  const json = await api.get<{ data: AgencyProject }>(`/api/agency/projects/${id}`)
  return json.data ?? null
}

export type ProjectInput = {
  title: string
  client_id?: string | null
  client_name?: string
  client_email?: string
  client_phone?: string
  client_company?: string
  status?: AgencyStatus
  priority?: AgencyPriority
  project_type?: string
  start_date?: string | null
  deadline?: string | null
  budget?: number
  currency?: string
  description?: string
  notes?: string
  member_ids?: string[]
}

export async function createProject(body: ProjectInput): Promise<AgencyProject> {
  const json = await api.post<{ data: AgencyProject }>('/api/agency/projects', body)
  return json.data
}

export async function updateProject(id: string, patch: Partial<ProjectInput>): Promise<void> {
  await api.patch(`/api/agency/projects/${id}`, patch)
}

export async function deleteProject(id: string): Promise<void> {
  await api.del(`/api/agency/projects/${id}`)
}

export async function setProjectStatus(id: string, status: AgencyStatus, note?: string): Promise<void> {
  await api.patch(`/api/agency/projects/${id}/status`, { status, note })
}

export async function addMilestone(
  id: string,
  body: { title: string; description?: string; due_date?: string | null },
): Promise<void> {
  await api.post(`/api/agency/projects/${id}/milestones`, body)
}

export async function setMilestoneCompleted(id: string, mid: string, is_completed: boolean): Promise<void> {
  await api.patch(`/api/agency/projects/${id}/milestones/${mid}`, { is_completed })
}

export async function deleteMilestone(id: string, mid: string): Promise<void> {
  await api.del(`/api/agency/projects/${id}/milestones/${mid}`)
}

export async function addUpdate(id: string, content: string): Promise<void> {
  await api.post(`/api/agency/projects/${id}/updates`, { content, update_type: 'note' })
}

export async function listMembers(): Promise<AgencyMember[]> {
  const json = await api.get<{ data: AgencyMember[] }>('/api/agency/members')
  return (json.data ?? []).filter((m) => m.is_active !== false)
}
