import { create } from 'zustand'

const API_URL = '/api/auth'

interface AuthUser {
  id: string
  username: string
  email: string
}

interface AuthStore {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null

  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: JSON.parse(localStorage.getItem('corruptio_user') || 'null'),
  accessToken: localStorage.getItem('corruptio_token'),
  refreshToken: localStorage.getItem('corruptio_refresh'),

  login: async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Login failed')
    }

    const data = await res.json()
    localStorage.setItem('corruptio_user', JSON.stringify(data.user))
    localStorage.setItem('corruptio_token', data.accessToken)
    localStorage.setItem('corruptio_refresh', data.refreshToken)

    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })
  },

  register: async (username, email, password) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Registration failed')
    }

    const data = await res.json()
    localStorage.setItem('corruptio_user', JSON.stringify(data.user))
    localStorage.setItem('corruptio_token', data.accessToken)
    localStorage.setItem('corruptio_refresh', data.refreshToken)

    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })
  },

  logout: () => {
    localStorage.removeItem('corruptio_user')
    localStorage.removeItem('corruptio_token')
    localStorage.removeItem('corruptio_refresh')
    set({ user: null, accessToken: null, refreshToken: null })
  },

  refreshAccessToken: async () => {
    const refresh = get().refreshToken
    if (!refresh) throw new Error('No refresh token')

    const res = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })

    if (!res.ok) {
      get().logout()
      throw new Error('Token refresh failed')
    }

    const data = await res.json()
    localStorage.setItem('corruptio_token', data.accessToken)
    localStorage.setItem('corruptio_refresh', data.refreshToken)

    set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })
  },
}))
