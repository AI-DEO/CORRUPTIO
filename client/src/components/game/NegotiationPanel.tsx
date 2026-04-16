import { useState } from 'react'
import type { PublicPlayerState, PhaseType } from '@shared/types'
import { useGameStore } from '../../stores/gameStore'
import { MAX_NEGOTIATION_MESSAGES } from '@shared/types'

interface Props {
  players: PublicPlayerState[]
  myPlayerId: string | undefined
  phase: PhaseType
  onSendMessage: (toPlayerId: string, content: string) => void
  onProposePact: (toPlayerId: string, type: 'formal' | 'secret', terms: string) => void
}

export default function NegotiationPanel({
  players,
  myPlayerId,
  phase,
  onSendMessage,
  onProposePact,
}: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [pactTerms, setPactTerms] = useState('')
  const [showPact, setShowPact] = useState(false)
  const messages = useGameStore((s) => s.messages)

  const isNegotiationPhase = phase === 'NEGOTIATION'
  const others = players.filter((p) => p.playerId !== myPlayerId && !p.isEliminated)

  function handleSend() {
    if (!selectedPlayer || !message.trim()) return
    onSendMessage(selectedPlayer, message.trim())
    setMessage('')
  }

  function handleProposePact(type: 'formal' | 'secret') {
    if (!selectedPlayer || !pactTerms.trim()) return
    onProposePact(selectedPlayer, type, pactTerms.trim())
    setPactTerms('')
    setShowPact(false)
  }

  return (
    <div className="flex h-full gap-3">
      {/* Player list */}
      <div className="w-40 shrink-0 space-y-1 overflow-y-auto">
        <div className="text-xs text-text-secondary mb-1">Destinataire</div>
        {others.map((p) => (
          <button
            key={p.playerId}
            onClick={() => setSelectedPlayer(p.playerId)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
              selectedPlayer === p.playerId
                ? 'bg-accent-teal/20 border border-accent-teal/50'
                : 'bg-bg-primary border border-transparent hover:border-bg-panel'
            }`}
          >
            {p.username}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedPlayer ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-2">
              {messages
                .filter(
                  (m) =>
                    m.fromPlayerId === selectedPlayer ||
                    m.fromPlayerId === myPlayerId
                )
                .map((m, i) => (
                  <div
                    key={i}
                    className={`text-sm p-2 rounded-lg max-w-[80%] ${
                      m.fromPlayerId === myPlayerId
                        ? 'bg-accent-teal/20 ml-auto'
                        : 'bg-bg-primary'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
              {messages.length === 0 && (
                <p className="text-xs text-text-secondary text-center py-4">
                  Les messages disparaissent après lecture.
                </p>
              )}
            </div>

            {/* Input */}
            {isNegotiationPhase ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message privé..."
                    maxLength={200}
                    className="flex-1 px-3 py-2 bg-bg-primary border border-bg-panel rounded-lg text-sm focus:outline-none focus:border-accent-teal"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-accent-teal hover:bg-accent-teal/80 disabled:opacity-50 rounded-lg text-sm font-medium"
                  >
                    Envoyer
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPact(!showPact)}
                    className="text-xs text-accent-gold hover:underline"
                  >
                    {showPact ? 'Annuler' : 'Proposer un pacte'}
                  </button>
                  <span className="text-xs text-text-secondary">
                    Max {MAX_NEGOTIATION_MESSAGES} messages/tour
                  </span>
                </div>

                {showPact && (
                  <div className="p-3 bg-bg-primary rounded-lg border border-accent-gold/30 space-y-2">
                    <input
                      value={pactTerms}
                      onChange={(e) => setPactTerms(e.target.value)}
                      placeholder="Termes du pacte..."
                      className="w-full px-3 py-2 bg-bg-secondary border border-bg-panel rounded-lg text-sm focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProposePact('formal')}
                        disabled={!pactTerms.trim()}
                        className="flex-1 py-2 bg-camp-order text-sm rounded-lg disabled:opacity-50"
                      >
                        Pacte Formel
                      </button>
                      <button
                        onClick={() => handleProposePact('secret')}
                        disabled={!pactTerms.trim()}
                        className="flex-1 py-2 bg-camp-shadow text-sm rounded-lg disabled:opacity-50"
                      >
                        Pacte Secret
                      </button>
                    </div>
                    <p className="text-[10px] text-text-secondary">
                      Formel : visible de tous, trahir = -10 REP. Secret : invisible, sans garantie.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-text-secondary text-center py-2">
                La négociation n'est possible qu'en phase de Négociation.
              </p>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
            Sélectionnez un joueur pour négocier
          </div>
        )}
      </div>
    </div>
  )
}
