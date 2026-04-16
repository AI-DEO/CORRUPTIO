import { useEffect, useState } from 'react'

export interface ToastMessage {
  id: string
  type: 'info' | 'success' | 'error' | 'warning'
  text: string
}

interface Props {
  messages: ToastMessage[]
  onDismiss: (id: string) => void
}

const COLORS = {
  info: 'bg-bg-panel border-accent-teal text-accent-teal',
  success: 'bg-bg-panel border-green-500 text-green-400',
  error: 'bg-bg-panel border-accent-red text-accent-red',
  warning: 'bg-bg-panel border-accent-gold text-accent-gold',
}

function ToastItem({ msg, onDismiss }: { msg: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`px-4 py-3 rounded-lg border-l-4 shadow-xl animate-slide-up ${COLORS[msg.type]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{msg.text}</span>
        <button
          onClick={onDismiss}
          className="text-text-secondary hover:text-text-primary text-lg leading-none"
        >
          &times;
        </button>
      </div>
    </div>
  )
}

export default function Toast({ messages, onDismiss }: Props) {
  if (messages.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {messages.map((msg) => (
        <ToastItem key={msg.id} msg={msg} onDismiss={() => onDismiss(msg.id)} />
      ))}
    </div>
  )
}
