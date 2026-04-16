import { useState } from 'react'
import type { TheatreEvent } from '@shared/types'
import { useTimer } from '../../hooks/useTimer'

interface Props {
  event: TheatreEvent
  onSurvive: (optionIndex: number) => void
}

export default function TheatreModal({ event, onSurvive }: Props) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const endTime = Date.now() + event.survivalWindowMs
  const { seconds, isUrgent } = useTimer(endTime)

  const intensityColors = {
    1: 'border-yellow-500 bg-yellow-500/10',
    2: 'border-accent-red bg-accent-red/10',
    3: 'border-red-700 bg-red-900/20',
  }

  const intensityLabels = {
    1: 'TROUBLE',
    2: 'SCANDALE',
    3: 'CRISE MAJEURE',
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div
        className={`w-full max-w-xl mx-4 rounded-2xl border-2 ${
          intensityColors[event.intensite]
        } overflow-hidden animate-slide-up shadow-2xl`}
      >
        {/* Header */}
        <div className="bg-bg-primary px-6 py-4 border-b border-bg-panel">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-red">
              Coup de Théâtre — {intensityLabels[event.intensite]}
            </span>
            <span
              className={`font-mono text-lg font-bold ${
                isUrgent ? 'text-accent-red animate-pulse' : 'text-text-primary'
              }`}
            >
              {seconds}s
            </span>
          </div>
          <h2 className="font-display text-2xl font-black text-accent-gold leading-tight">
            {event.titreJournal}
          </h2>
        </div>

        {/* Narrative */}
        <div className="px-6 py-4 bg-bg-secondary">
          <p className="text-sm text-text-primary leading-relaxed">
            {event.declencheurNarratif}
          </p>

          {/* Effects */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {event.effetsMetaniques.cible.ip && (
              <div className="text-xs p-2 bg-bg-primary rounded">
                <span className="text-text-secondary">IP:</span>{' '}
                <span
                  className={
                    event.effetsMetaniques.cible.ip < 0
                      ? 'text-accent-red'
                      : 'text-accent-teal'
                  }
                >
                  {event.effetsMetaniques.cible.ip > 0 ? '+' : ''}
                  {event.effetsMetaniques.cible.ip}
                </span>
              </div>
            )}
            {event.effetsMetaniques.cible.rep && (
              <div className="text-xs p-2 bg-bg-primary rounded">
                <span className="text-text-secondary">REP:</span>{' '}
                <span
                  className={
                    event.effetsMetaniques.cible.rep < 0
                      ? 'text-accent-red'
                      : 'text-green-400'
                  }
                >
                  {event.effetsMetaniques.cible.rep > 0 ? '+' : ''}
                  {event.effetsMetaniques.cible.rep}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Survival options */}
        <div className="px-6 py-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">
            Options de Survie
          </h3>
          <div className="space-y-2">
            {event.optionsSurvie.map((option, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption(i)}
                className={`w-full p-3 rounded-lg border text-left transition ${
                  selectedOption === i
                    ? 'border-accent-teal bg-accent-teal/10'
                    : 'border-bg-panel bg-bg-primary hover:border-accent-teal/50'
                }`}
              >
                <div className="text-sm font-medium">{option.condition}</div>
                <div className="text-xs text-text-secondary mt-1">
                  {option.effet}
                </div>
                <div className="text-xs text-accent-gold mt-1">
                  Coût: {option.cout}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => selectedOption !== null && onSurvive(selectedOption)}
            disabled={selectedOption === null}
            className="w-full mt-4 py-3 bg-accent-red hover:bg-accent-red/80 disabled:opacity-50 rounded-lg font-bold text-lg transition"
          >
            {selectedOption !== null ? 'Utiliser cette option' : 'Choisissez une option'}
          </button>
        </div>

        {/* Consequences */}
        <div className="px-6 py-3 bg-bg-primary border-t border-bg-panel">
          <p className="text-xs text-text-secondary italic">
            {event.consequencesNarratives}
          </p>
        </div>
      </div>
    </div>
  )
}
