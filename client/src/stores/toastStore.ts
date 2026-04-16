import { create } from 'zustand'
import type { ToastMessage } from '../components/ui/Toast'

interface ToastStore {
  messages: ToastMessage[]
  addToast: (type: ToastMessage['type'], text: string) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  messages: [],

  addToast: (type, text) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    set((state) => ({
      messages: [...state.messages.slice(-4), { id, type, text }],
    }))
  },

  dismiss: (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }))
  },
}))
