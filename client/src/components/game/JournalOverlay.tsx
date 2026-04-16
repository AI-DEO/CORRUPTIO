import type { JournalEntry } from '@shared/types'

interface Props {
  entry: JournalEntry
}

export default function JournalOverlay({ entry }: Props) {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 animate-fade-in">
      <div className="w-full max-w-lg mx-4 animate-slide-up">
        {/* Newspaper style */}
        <div className="bg-[#F5F0E1] text-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-[#2C1810] text-[#F5F0E1] px-6 py-3 text-center">
            <div className="text-xs tracking-[0.3em] uppercase mb-1">
              Le Journal de
            </div>
            <div className="font-display text-2xl font-black tracking-wide">
              Porto Mendacio
            </div>
            <div className="text-xs mt-1 opacity-70">
              Tour {entry.turn} — Édition Spéciale
            </div>
          </div>

          {/* Headline */}
          <div className="px-6 py-4 border-b-2 border-[#2C1810]">
            <h2 className="font-display text-xl font-black leading-tight text-center">
              {entry.headline}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-2">
            {entry.items.map((item, i) => (
              <p key={i} className="text-sm leading-relaxed">
                {item}
              </p>
            ))}

            {entry.items.length === 0 && (
              <p className="text-sm text-center italic opacity-60">
                Une journée étrangement calme à Porto Mendacio...
              </p>
            )}
          </div>

          {/* Revelation */}
          {entry.reveal && (
            <div className="mx-6 mb-4 p-3 bg-red-100 border-l-4 border-red-600 rounded-r">
              <div className="text-xs font-bold text-red-800 uppercase mb-1">
                Exclusif
              </div>
              <p className="text-sm text-red-900">{entry.reveal}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-2 bg-[#2C1810] text-[#F5F0E1] text-center text-[10px] opacity-70">
            &copy; Porto Mendacio Gazette — Toute reproduction interdite
          </div>
        </div>
      </div>
    </div>
  )
}
