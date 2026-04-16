import type { GameEngine } from './GameEngine'

export class TurnManager {
  private engine: GameEngine

  constructor(engine: GameEngine) {
    this.engine = engine
  }

  // Turn progression is handled by GameEngine.advancePhase()
  // This class provides helper utilities for turn management

  getTurnInfo() {
    return {
      turn: this.engine.getCurrentTurn(),
      phase: this.engine.getCurrentPhase(),
      playerCount: this.engine.getPlayerCount(),
    }
  }

  haveAllPlayersActed(): boolean {
    return this.engine
      .getAllPlayers()
      .filter((p) => !p.isEliminated)
      .every((p) => p.hasActedThisTurn)
  }
}
