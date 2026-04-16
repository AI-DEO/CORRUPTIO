interface Props {
  isOpen: boolean
  onClose: () => void
  side: 'left' | 'right'
  title: string
  children: React.ReactNode
}

export default function MobileDrawer({ isOpen, onClose, side, title, children }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`absolute top-0 bottom-0 w-80 bg-bg-secondary border-bg-panel overflow-y-auto animate-slide-up ${
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l'
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b border-bg-panel">
          <h3 className="font-semibold text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-panel text-text-secondary"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
