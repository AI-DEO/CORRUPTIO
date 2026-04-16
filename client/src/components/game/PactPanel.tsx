import { useState } from 'react'
import type { PublicPact } from '@shared/types'

interface Props {
  pacts: PublicPact[]
  myPlayerId: string | undefined
  onBreakPact: (pactId: string) => void
}

export default function PactPanel({ pacts, myPlayerId, onBreakPact }: Props) {
  const [confirmBreak, setConfirmBreak] = useState<string | null>(null)

  const myPacts = pacts.filter(
    (p) => p.player1Id === myPlayerId || p.player2Id === myPlayerId
  )
  const otherPacts = pacts.filter(
    (p) => p.player1Id !== myPlayerId && p.player2Id !== myPlayerId
  )

  function handleBreak(pactId: string) {
    if (confirmBreak === pactId) {
      onBreakPact(pactId)
      setConfirmBreak(null)
    } else {
      setConfirmBreak(pactId)
    }
  }

  return (
    <div className="space-y-4">
      {/* My pacts */}
      <div>
        <h4 className="text-xs font-semibold text-text-secondary uppercase mb-2">
          Mes Pactes
        </h4>
        {myPacts.length === 0 ? (
          <p className="text-xs text-text-secondary">Aucun pacte actif</p>
        ) : (
          <div className="space-y-2">
            {myPacts.map((pact) => (
              <div
                key={pact.pactId}
                className={`p-3 rounded-lg border ${
                  pact.status === 'broken'
                    ? 'border-accent-red/50 bg-accent-red/5'
                    : 'border-accent-gold/30 bg-accent-gold/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">
                      Pacte formel
                    </span>
                    <span className="text-xs text-text-secondary ml-2">
                      Tour {pact.createdTurn}
                    </span>
                  </div>
                  {pact.status === 'active' ? (
                    <button
                      onClick={() => handleBreak(pact.pactId)}
                      className={`text-xs px-3 py-1 rounded transition ${
                        confirmBreak === pact.pactId
                          ? 'bg-accent-red text-white'
                          : 'bg-accent-red/20 text-accent-red hover:bg-accent-red/30'
                      }`}
                    >
                      {confirmBreak === pact.pactId
                        ? 'Confirmer (-10 REP)'
                        : 'Rompre'}
                    </button>
                  ) : (
                    <span className="text-xs text-accent-red font-semibold">
                      ROMPU
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other pacts */}
      {otherPacts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-text-secondary uppercase mb-2">
            Autres Pactes
          </h4>
          <div className="space-y-2">
            {otherPacts.map((pact) => (
              <div
                key={pact.pactId}
                className="p-3 rounded-lg border border-bg-panel bg-bg-primary"
              >
                <div className="text-sm">
                  <span className="text-text-secondary">Alliance formelle</span>
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Depuis le tour {pact.createdTurn} —{' '}
                  {pact.status === 'broken' ? (
                    <span className="text-accent-red">Rompu</span>
                  ) : (
                    <span className="text-accent-teal">Actif</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
