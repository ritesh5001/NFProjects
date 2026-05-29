import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../config'

const TOKEN_KEY = 'ngf_auth_token'
let cachedToken: string | null | undefined // undefined = not loaded yet

export async function getToken(): Promise<string | null> {
  if (cachedToken === undefined) {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY)
  }
  return cachedToken
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token)
  else await AsyncStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiOptions = { method?: string; body?: unknown; auth?: boolean }

export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.auth !== false) {
    const token = await getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError('Network error — check your connection and the server URL.', 0)
  }

  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && 'error' in json && typeof (json as { error: unknown }).error === 'string'
        ? (json as { error: string }).error
        : null) || `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }
  return json as T
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
