import { api } from './client'
import { Client } from '../types'

// Shape returned by the website's /api/admin/client-users endpoints.
type ClientUserRow = {
  id: string
  name: string | null
  company: string | null
  email: string
  phone: string | null
  is_active: boolean
  created_at?: string
}

function toClient(row: ClientUserRow): Client {
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    company: row.company ?? '',
    created_at: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  }
}

// List active clients (matches the website Clients admin section).
export async function getClients(): Promise<Client[]> {
  const json = await api.get<{ data: ClientUserRow[] }>('/api/admin/client-users')
  return (json.data ?? [])
    .filter((c) => c.is_active !== false)
    .map(toClient)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getClient(id: string): Promise<Client | null> {
  const json = await api.get<{ data: ClientUserRow[] }>('/api/admin/client-users')
  const row = (json.data ?? []).find((c) => c.id === id)
  return row ? toClient(row) : null
}

export type NewClientInput = {
  name?: string
  email: string
  phone?: string
  company?: string
  password: string
}

export async function addClient(data: NewClientInput): Promise<Client> {
  const json = await api.post<{ data: ClientUserRow }>('/api/admin/client-users', {
    name: data.name ?? '',
    email: data.email,
    phone: data.phone ?? '',
    company: data.company ?? '',
    password: data.password,
  })
  return toClient(json.data)
}

export async function updateClient(
  id: string,
  data: Partial<{ name: string; email: string; phone: string; company: string }>,
): Promise<void> {
  await api.patch(`/api/admin/client-users/${id}`, data)
}

// "Delete" deactivates the account on the website (soft delete).
export async function deleteClient(id: string): Promise<void> {
  await api.del(`/api/admin/client-users/${id}`)
}

// Project counts come from a later phase (agency projects). Returns 0 for now.
export async function getClientProjectCount(_clientId: string): Promise<number> {
  return 0
}
