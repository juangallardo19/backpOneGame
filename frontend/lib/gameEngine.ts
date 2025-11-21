import { Card, CardColor, CardType } from '../types/game.types'

// Local simplified interfaces for the game engine
interface SimplePlayer {
  id: number;
  name: string;
  hand: Card[];
}

interface SimpleGameState {
  players: SimplePlayer[];
  drawPile: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  gameStatus: 'playing' | 'finished';
  winner?: number;
}

const createDeck = (): Card[] => {
  // UNO deck original format
  const DECK_STRINGS = [
    "0r", "0y", "0b", "0g", // 0's
    "1r", "1r", "1y", "1y", "1b", "1b", "1g", "1g", // 1's
    "2r", "2r", "2y", "2y", "2b", "2b", "2g", "2g", // 2's  
    "3r", "3r", "3y", "3y", "3b", "3b", "3g", "3g", // 3's
    "4r", "4r", "4y", "4y", "4b", "4b", "4g", "4g", // 4's
    "5r", "5r", "5y", "5y", "5b", "5b", "5g", "5g", // 5's
    "6r", "6r", "6y", "6y", "6b", "6b", "6g", "6g", // 6's
    "7r", "7r", "7y", "7y", "7b", "7b", "7g", "7g", // 7's
    "8r", "8r", "8y", "8y", "8b", "8b", "8g", "8g", // 8's
    "9r", "9r", "9y", "9y", "9b", "9b", "9g", "9g", // 9's
    "d2r", "d2r", "d2y", "d2y", "d2b", "d2b", "d2g", "d2g", // Draw Two's
    "sr", "sr", "sy", "sy", "sb", "sb", "sg", "sg", // Skip's
    "rr", "rr", "ry", "ry", "rb", "rb", "rg", "rg", // Reverse's
    "w", "w", "w", "w", // Wild's
    "w+4", "w+4", "w+4", "w+4" // Wild +4's
  ]

  const deck: Card[] = DECK_STRINGS.map((cardStr, idx) => {
    const getColor = (str: string): CardColor => {
      if (str.includes('r')) return CardColor.RED
      if (str.includes('y')) return CardColor.YELLOW
      if (str.includes('b')) return CardColor.BLUE
      if (str.includes('g')) return CardColor.GREEN
      return CardColor.WILD
    }

    const getType = (str: string): CardType => {
      if (str.includes('d2')) return CardType.DRAW_TWO
      if (str.includes('s')) return CardType.SKIP
      if (str.includes('r') && str.length > 2) return CardType.REVERSE
      if (str.includes('w+4')) return CardType.WILD_DRAW_FOUR
      if (str === 'w') return CardType.WILD
      return CardType.NUMBER
    }

    const getValue = (str: string): number | null => {
      if (str.includes('d2') || str.includes('s') || str.includes('r') || str.includes('w')) {
        return null // Special cards have no numeric value
      }
      return parseInt(str.replace(/[rgby]/g, ''))
    }

    return {
      id: `card_${idx}`,
      color: getColor(cardStr),
      type: getType(cardStr),
      value: getValue(cardStr)
    }
  })

  return deck.sort(() => Math.random() - 0.5)
}

export const initializeGame = (numPlayers: number = 4): SimpleGameState => {
  const deck = createDeck()
  const players = []

  for (let i = 0; i < numPlayers; i++) {
    const hand = deck.splice(0, 7)
    players.push({
      id: i,
      name: i === 0 ? 'You' : `CPU ${i}`,
      hand
    })
  }

  const firstCard = deck.splice(0, 1)[0]

  return {
    players,
    drawPile: deck,
    discardPile: [firstCard],
    currentPlayerIndex: 0,
    gameStatus: 'playing'
  }
}

export const getTopDiscard = (gameState: SimpleGameState): Card | null => {
  return gameState.discardPile.length > 0
    ? gameState.discardPile[gameState.discardPile.length - 1]
    : null
}

export const canPlayCard = (card: Card, topDiscard: Card | null): boolean => {
  if (!topDiscard) return true

  // Wild cards always playable
  if (card.color === CardColor.WILD) return true

  // Same color
  if (card.color === topDiscard.color) return true

  // Same type
  if (card.type === topDiscard.type) return true

  // Same value (ONLY for NUMBER cards to avoid null === null)
  // Special cards have value: null
  if (card.type === CardType.NUMBER && topDiscard.type === CardType.NUMBER && card.value === topDiscard.value) {
    return true
  }

  return false
}

export const playCard = (
  gameState: SimpleGameState,
  playerIndex: number,
  cardIndex: number
): SimpleGameState => {
  const newState = JSON.parse(JSON.stringify(gameState)) as SimpleGameState
  const player = newState.players[playerIndex]

  if (cardIndex < 0 || cardIndex >= player.hand.length) {
    return gameState
  }

  const card = player.hand[cardIndex]
  player.hand.splice(cardIndex, 1)
  newState.discardPile.push(card)
  newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length

  if (player.hand.length === 0) {
    newState.gameStatus = 'finished'
    newState.winner = playerIndex
  }

  return newState
}

export const drawCard = (gameState: SimpleGameState, playerIndex: number): SimpleGameState => {
  const newState = JSON.parse(JSON.stringify(gameState)) as SimpleGameState
  const player = newState.players[playerIndex]

  if (newState.drawPile.length === 0 && newState.discardPile.length > 1) {
    const topCard = newState.discardPile.pop()!
    newState.drawPile = newState.discardPile.sort(() => Math.random() - 0.5)
    newState.discardPile = [topCard]
  }

  if (newState.drawPile.length > 0) {
    const card = newState.drawPile.pop()!
    player.hand.push(card)
  }

  newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length
  return newState
}
