import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiFetch, getToken, setToken } from '../api/client'

interface AuthState {
  ready: boolean // finished checking stored token
  token: string | null
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  ready: false,
  token: null,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [token, setTokenState] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const stored = await getToken()
      if (!active) return
      if (stored) {
        // Validate the stored token; drop it if rejected.
        try {
          await apiFetch('/api/admin/me')
          setTokenState(stored)
        } catch {
          await setToken(null)
          setTokenState(null)
        }
      }
      setReady(true)
    })()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (password: string) => {
    const json = await apiFetch<{ token: string }>('/api/admin/login', {
      method: 'POST',
      body: { password },
      auth: false,
    })
    await setToken(json.token)
    setTokenState(json.token)
  }, [])

  const logout = useCallback(async () => {
    await setToken(null)
    setTokenState(null)
  }, [])

  return <AuthContext.Provider value={{ ready, token, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
