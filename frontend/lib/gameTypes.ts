// Card type definitions
export type CardColor = 'red' | 'yellow' | 'blue' | 'green' | 'black'
export type CardNumber = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export type CardAction = 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4'

export interface Card {
  id: string
  color: CardColor
  type: CardNumber | CardAction
  display: string
}

export interface Player {
  id: number
  name: string
  hand: Card[]
}

export interface GameState {
  players: Player[]
  drawPile: Card[]
  discardPile: Card[]
  currentPlayerIndex: number
  gameStatus: 'setup' | 'playing' | 'finished'
  winner?: number
}

export interface GameRoom {
  gameState: GameState
  isMyTurn: (playerIndex: number) => boolean
  canPlayCard: (card: Card) => boolean
  getTopDiscard: () => Card | null
}
