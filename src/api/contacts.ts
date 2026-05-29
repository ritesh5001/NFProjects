import { api } from './client'

export interface Contact {
  id: string
  email: string
  name: string | null
  company: string | null
  phone: string | null
  website: string | null
  industry: string | null
  notes: string | null
  unsubscribed: boolean
  created_at: string
}

type ListResp = { data?: Contact[]; count?: number; setupRequired?: boolean }

export async function listContacts(q = ''): Promise<Contact[]> {
  const json = await api.get<ListResp>(`/api/admin/contacts?limit=200&q=${encodeURIComponent(q)}`)
  if (json.setupRequired) return []
  return json.data ?? []
}

export type ContactInput = {
  email: string
  name?: string
  company?: string
  phone?: string
  website?: string
  industry?: string
  notes?: string
}

export async function createContact(body: ContactInput): Promise<Contact> {
  const json = await api.post<{ data: Contact }>('/api/admin/contacts', body)
  return json.data
}

export async function updateContact(id: string, body: Partial<ContactInput & { unsubscribed: boolean }>): Promise<Contact> {
  const json = await api.patch<{ data: Contact }>(`/api/admin/contacts/${id}`, body)
  return json.data
}

export async function deleteContact(id: string): Promise<void> {
  await api.del(`/api/admin/contacts/${id}`)
}
