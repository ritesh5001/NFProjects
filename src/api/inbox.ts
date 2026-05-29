import { api } from './client'

function unwrapList<T>(json: { data?: T[]; setupRequired?: boolean }): T[] {
  if (json.setupRequired) return []
  return json.data ?? []
}

// ---- Campaigns (read) ----
export interface Campaign {
  id: string
  name: string
  description: string | null
  status: string
  subject: string
  from_email: string
  created_at: string
}
export async function listCampaigns(): Promise<Campaign[]> {
  return unwrapList(await api.get<{ data?: Campaign[] }>('/api/admin/campaigns'))
}

// ---- Booking requests ----
export interface BookingRequest {
  id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  request_type: 'meeting' | 'callback'
  project_summary: string | null
  budget: string | null
  timeline: string | null
  preferred_contact_time: string | null
  scheduled_at: string | null
  slot_label: string | null
  status: string
  created_at: string
}
export async function listBookings(q = ''): Promise<BookingRequest[]> {
  return unwrapList(await api.get<{ data?: BookingRequest[]; setupRequired?: boolean }>(
    `/api/admin/booking-requests?limit=200&q=${encodeURIComponent(q)}`,
  ))
}

// ---- Chatbot conversations ----
export interface ChatbotConversation {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  status: string
  last_user_message: string | null
  last_assistant_message: string | null
  ai_summary: string | null
  created_at: string
}
export interface ChatbotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
export async function listChatbot(q = ''): Promise<ChatbotConversation[]> {
  return unwrapList(await api.get<{ data?: ChatbotConversation[]; setupRequired?: boolean }>(
    `/api/admin/chatbot-conversations?limit=200&q=${encodeURIComponent(q)}`,
  ))
}
export async function getChatbot(id: string): Promise<{ conversation: ChatbotConversation; messages: ChatbotMessage[] } | null> {
  const json = await api.get<{ data?: { conversation: ChatbotConversation; messages: ChatbotMessage[] } }>(
    `/api/admin/chatbot-conversations/${id}`,
  )
  return json.data ?? null
}

// ---- Project estimator submissions ----
export interface EstimatorSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  project_type: string
  goals: string
  notes: string | null
  estimate_summary: string
  estimated_cost_min: number
  estimated_cost_max: number
  estimated_timeline_min_weeks: number
  estimated_timeline_max_weeks: number
  confidence: string
  highlighted_features: string[]
  scope_breakdown: string[]
  next_step: string
  created_at: string
}
export async function listEstimates(q = ''): Promise<EstimatorSubmission[]> {
  return unwrapList(await api.get<{ data?: EstimatorSubmission[]; setupRequired?: boolean }>(
    `/api/admin/project-estimator-submissions?limit=200&q=${encodeURIComponent(q)}`,
  ))
}

// ---- Contact form submissions ----
export interface ContactForm {
  id: string
  name: string
  email: string
  phone: string
  message: string
  information_source: string
  status: string
  created_at: string
}
export async function listForms(q = ''): Promise<ContactForm[]> {
  return unwrapList(await api.get<{ data?: ContactForm[]; setupRequired?: boolean }>(
    `/api/admin/contact-forms?limit=200&q=${encodeURIComponent(q)}`,
  ))
}
