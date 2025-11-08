import { Card, CardColor, CardNumber, CardAction, GameState } from './gameTypes'

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
      if (str.includes('r')) return 'red'
      if (str.includes('y')) return 'yellow'
      if (str.includes('b')) return 'blue'
      if (str.includes('g')) return 'green'
      return 'black'
    }

    const getType = (str: string): CardNumber | CardAction => {
      if (str.includes('d2')) return 'draw2'
      if (str.includes('s')) return 'skip'
      if (str.includes('r') && str.length > 2) return 'reverse'
      if (str.includes('w+4')) return 'wild_draw4'
      if (str === 'w') return 'wild'
      return str.replace(/[rgby]/g, '') as CardNumber
    }

    return {
      id: `card_${idx}`,
      color: getColor(cardStr),
      type: getType(cardStr),
      display: cardStr
    }
  })

  return deck.sort(() => Math.random() - 0.5)
}

export const initializeGame = (numPlayers: number = 4): GameState => {
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

export const getTopDiscard = (gameState: GameState): Card | null => {
  return gameState.discardPile.length > 0
    ? gameState.discardPile[gameState.discardPile.length - 1]
    : null
}

export const canPlayCard = (card: Card, topDiscard: Card | null): boolean => {
  if (!topDiscard) return true
  if (card.color === 'black') return true
  if (card.color === topDiscard.color) return true
  if (card.type === topDiscard.type) return true
  return false
}

export const playCard = (
  gameState: GameState,
  playerIndex: number,
  cardIndex: number
): GameState => {
  const newState = JSON.parse(JSON.stringify(gameState)) as GameState
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

export const drawCard = (gameState: GameState, playerIndex: number): GameState => {
  const newState = JSON.parse(JSON.stringify(gameState)) as GameState
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
