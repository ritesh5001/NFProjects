import { api } from './client'

export type LeadStatus =
  | 'new' | 'contacted' | 'replied' | 'meeting_scheduled' | 'proposal_sent' | 'won' | 'lost' | 'not_interested'

export const LEAD_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'replied', 'meeting_scheduled', 'proposal_sent', 'won', 'lost', 'not_interested',
]

export function leadStatusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export interface Lead {
  id: string
  company_name: string
  contact_name: string | null
  contact_title: string | null
  email: string | null
  phone: string | null
  website: string | null
  industry: string | null
  company_size: string | null
  location: string | null
  target_service: string | null
  pain_point: string | null
  status: LeadStatus
  source: string | null
  notes: string | null
  created_at: string
}

type ListResp = { data?: Lead[]; count?: number; setupRequired?: boolean }

export async function listLeads(q = '', status = ''): Promise<Lead[]> {
  const params = new URLSearchParams({ limit: '200' })
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  const json = await api.get<ListResp>(`/api/admin/leads?${params.toString()}`)
  if (json.setupRequired) return []
  return json.data ?? []
}

export type LeadInput = {
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  website?: string
  industry?: string
  location?: string
  target_service?: string
  pain_point?: string
  status?: LeadStatus
  notes?: string
}

export async function createLead(body: LeadInput): Promise<Lead> {
  const json = await api.post<{ data: Lead }>('/api/admin/leads', body)
  return json.data
}

export async function updateLead(id: string, body: Partial<LeadInput>): Promise<Lead> {
  return api.patch<Lead>(`/api/admin/leads/${id}`, body)
}

export async function deleteLead(id: string): Promise<void> {
  await api.del(`/api/admin/leads/${id}`)
}
