import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import GalaxySpiral from './GalaxySpiral';
import ParticleCanvas from './ParticleCanvas';
import UnoCardsBackground from './UnoCardsBackground';

// Types
type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
type CardType = 'number' | 'action' | 'wild';
type CardValue = string;

interface CardData {
  color: CardColor;
  value: CardValue;
  type: CardType;
}

interface PlayerData {
  name: string;
  isAI: boolean;
  hand: Card[];
  position: { x: number; z: number };
}

interface TableCard {
  card: Card;
  mesh: THREE.Mesh;
}

// Card class
class Card {
  color: CardColor;
  value: CardValue;
  type: CardType;
  mesh: THREE.Mesh | null;

  constructor(color: CardColor, value: CardValue, type: CardType = 'number') {
    this.color = color;
    this.value = value;
    this.type = type;
    this.mesh = null;
  }

  createMesh(isFaceUp: boolean = true, cardBackTexture: THREE.Texture): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(3.2, 4.8, 0.05);
    let materials: THREE.MeshLambertMaterial[] = [];

    if (isFaceUp) {
      const frontTexture = createCardTexture(this.color, this.value);
      
      materials = [
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        new THREE.MeshLambertMaterial({ map: frontTexture }),
        new THREE.MeshLambertMaterial({ map: cardBackTexture })
      ];
    } else {
      materials = [
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        new THREE.MeshLambertMaterial({ map: cardBackTexture }),
        new THREE.MeshLambertMaterial({ map: cardBackTexture })
      ];
    }

    this.mesh = new THREE.Mesh(geometry, materials);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    (this.mesh as any).userData = { card: this };
    return this.mesh;
  }

  canPlayOn(otherCard: Card): boolean {
    if (this.color === 'wild') return true;
    if (this.color === otherCard.color) return true;
    if (this.value === otherCard.value) return true;
    return false;
  }
}

// Player class
class Player {
  name: string;
  isAI: boolean;
  hand: Card[];
  position: { x: number; z: number };

  constructor(name: string, isAI: boolean, position: { x: number; z: number }) {
    this.name = name;
    this.isAI = isAI;
    this.hand = [];
    this.position = position;
  }

  addCard(card: Card) {
    this.hand.push(card);
  }

  removeCard(card: Card) {
    const index = this.hand.indexOf(card);
    if (index > -1) {
      this.hand.splice(index, 1);
    }
  }

  getPlayableCards(topCard: Card): Card[] {
    return this.hand.filter(card => card.canPlayOn(topCard));
  }

  hasUno(): boolean {
    return this.hand.length === 1;
  }

  hasWon(): boolean {
    return this.hand.length === 0;
  }
}

// AI Card Pile class
class AICardPile {
  playerIndex: number;
  position: { x: number; z: number };
  cards: Array<{ card: Card; mesh: THREE.Mesh }>;
  base: THREE.Mesh | null;

  constructor(playerIndex: number, position: { x: number; z: number }, scene: THREE.Scene) {
    this.playerIndex = playerIndex;
    this.position = position;
    this.cards = [];
    this.base = null;
    this.createBase(scene);
  }

  createBase(scene: THREE.Scene) {
    const geometry = new THREE.CylinderGeometry(2, 2, 0.5, 32);
    const material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.base = new THREE.Mesh(geometry, material);
    this.base.position.set(this.position.x, -2.25, this.position.z);
    this.base.receiveShadow = true;
    scene.add(this.base);
  }

  addCard(card: Card, scene: THREE.Scene, cardBackTexture: THREE.Texture) {
    const mesh = card.createMesh(false, cardBackTexture);
    mesh.position.set(
      this.position.x + (Math.random() - 0.5) * 0.5,
      -2 + this.cards.length * 0.1,
      this.position.z + (Math.random() - 0.5) * 0.5
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = (Math.random() - 0.5) * 0.2;
    mesh.rotation.y = (Math.random() - 0.5) * 0.2;
    scene.add(mesh);
    
    this.cards.push({ card, mesh });
  }

  removeCard(scene: THREE.Scene): Card | null {
    if (this.cards.length === 0) return null;
    
    const cardObj = this.cards.pop()!;
    scene.remove(cardObj.mesh);
    return cardObj.card;
  }

  updateCards() {
    this.cards.forEach((cardObj, index) => {
      cardObj.mesh.position.y = -2 + index * 0.1;
    });
  }

  clear(scene: THREE.Scene) {
    this.cards.forEach(cardObj => {
      scene.remove(cardObj.mesh);
    });
    this.cards = [];
    if (this.base) {
      scene.remove(this.base);
    }
  }

  getCardCount(): number {
    return this.cards.length;
  }
}

// Helper functions
const COLORS: CardColor[] = ['red', 'yellow', 'green', 'blue'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTIONS = ['skip', 'reverse', 'draw2'];
const WILDS = ['wild', 'wild4'];

function createWoodTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 0, 512, 512);
  
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 2;
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, 0);
    ctx.bezierCurveTo(
      Math.random() * 512, Math.random() * 256,
      Math.random() * 512, Math.random() * 256,
      Math.random() * 512, 512
    );
    ctx.stroke();
  }
  
  return new THREE.CanvasTexture(canvas);
}

function createCardTexture(color: CardColor, value: CardValue): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  if (color === 'wild') {
    const gradient = ctx.createRadialGradient(256, 384, 100, 256, 384, 300);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#ff0000');
    gradient.addColorStop(0.5, '#ffff00');
    gradient.addColorStop(0.7, '#00ff00');
    gradient.addColorStop(0.9, '#0000ff');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
  } else {
    const colors: Record<string, string[]> = {
      red: ['#ff6b6b', '#cc0000'],
      yellow: ['#ffd93d', '#ffcc00'],
      green: ['#6bcf7f', '#00cc00'],
      blue: ['#4d96ff', '#0066cc']
    };
    const gradient = ctx.createLinearGradient(0, 0, 512, 768);
    gradient.addColorStop(0, colors[color][0]);
    gradient.addColorStop(1, colors[color][1]);
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, 512, 768);

  ctx.beginPath();
  ctx.arc(256, 384, 160, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = color === 'wild' ? '#000' : (color === 'yellow' ? '#333' : '#fff');
  ctx.font = 'bold 144px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let displayValue = value;
  if (value === 'skip') displayValue = '⊘';
  else if (value === 'reverse') displayValue = '⟲';
  else if (value === 'draw2') displayValue = '+2';
  else if (value === 'wild') displayValue = '🌈';
  else if (value === 'wild4') displayValue = '+4';
  
  ctx.fillText(displayValue, 256, 384);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 56px Arial';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 8;
  ctx.fillText('UNO', 256, 80);
  ctx.fillText('UNO', 256, 708);
  ctx.shadowBlur = 0;

  ctx.font = 'bold 48px Arial';
  ctx.fillText(displayValue, 60, 60);
  ctx.fillText(displayValue, 452, 708);

  return new THREE.CanvasTexture(canvas);
}

function createCardBackTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(256, 384, 100, 256, 384, 300);
  gradient.addColorStop(0, '#ff4444');
  gradient.addColorStop(1, '#cc0000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 768);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 12;
  ctx.fillText('UNO', 256, 384);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, 472, 728);

  return new THREE.CanvasTexture(canvas);
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getCardSymbol(value: string): string {
  if (value === 'skip') return '⊘';
  if (value === 'reverse') return '⟲';
  if (value === 'draw2') return '+2';
  if (value === 'wild') return '🌈';
  if (value === 'wild4') return '+4';
  return value;
}

// Main Component
interface UnoGame3DProps {
  onBack?: () => void;
}

const UnoGame3D: React.FC<UnoGame3DProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cardBackTextureRef = useRef<THREE.Texture | null>(null);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [gameDirection, setGameDirection] = useState(1);
  const [drawPile, setDrawPile] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [tableCards, setTableCards] = useState<TableCard[]>([]);
  const [waitingForColorSelection, setWaitingForColorSelection] = useState(false);
  const [aiPiles, setAiPiles] = useState<AICardPile[]>([]);
  const [dealingAnimation, setDealingAnimation] = useState(false);
  const [gameMessage, setGameMessage] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const turnIndicatorStyles: Array<React.CSSProperties> = [
    {
      top: '72%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    {
      top: '18%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    {
      top: '50%',
      left: '24%',
      transform: 'translate(-50%, -50%)',
    },
    {
      top: '50%',
      left: '76%',
      transform: 'translate(-50%, -50%)',
    },
  ];

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, [onBack]);

  // Refs for mutable game state
  const gameStateRef = useRef({
    currentPlayer: 0,
    gameDirection: 1,
    drawPile: [] as Card[],
    discardPile: [] as Card[],
    players: [] as Player[],
    currentCard: null as Card | null,
    gameEnded: false,
    tableCards: [] as TableCard[],
    waitingForColorSelection: false,
    aiPiles: [] as AICardPile[],
  });

  // Initialize Three.js
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffd700, 0.8, 30);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    camera.position.set(0, 15, 12);
    camera.lookAt(0, 0, 0);

    const tableGeometry = new THREE.BoxGeometry(24, 1, 18);
    const tableMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513,
      map: createWoodTexture()
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -2.5;
    table.receiveShadow = true;
    scene.add(table);

    for (let x = -10; x <= 10; x += 20) {
      for (let z = -7; z <= 7; z += 14) {
        const legGeometry = new THREE.BoxGeometry(1, 4, 1);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(x, -4.5, z);
        leg.castShadow = true;
        scene.add(leg);
      }
    }

    const cardBackTexture = createCardBackTexture();
    cardBackTextureRef.current = cardBackTexture;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const showMessageFunc = useCallback((message: string) => {
    setGameMessage(message);
    setTimeout(() => setGameMessage(''), 2000);
  }, []);

  const addCardToTable = useCallback((card: Card) => {
    if (!sceneRef.current || !cardBackTextureRef.current) return;

    const mesh = card.createMesh(true, cardBackTextureRef.current);
    const currentTableCards = gameStateRef.current.tableCards;
    
    mesh.position.set(0, -1.5 + (currentTableCards.length * 0.1), 0);
    mesh.rotation.x = -Math.PI / 2;
    
    sceneRef.current.add(mesh);
    
    const newTableCard = { card, mesh };
    gameStateRef.current.tableCards.push(newTableCard);
    setTableCards([...gameStateRef.current.tableCards]);
  }, []);

  const animateCardToPlayer = useCallback((card: Card) => {
    if (!sceneRef.current || !cardBackTextureRef.current) return;

    const mesh = card.createMesh(false, cardBackTextureRef.current);
    mesh.position.set(0, 5, 0);
    sceneRef.current.add(mesh);
    
    const startPos = {x: 0, y: 5, z: 0};
    const endPos = {x: 0, y: 1, z: 8};
    const duration = 500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      mesh.position.x = startPos.x + (endPos.x - startPos.x) * easeProgress;
      mesh.position.y = startPos.y + (endPos.y - startPos.y) * easeProgress;
      mesh.position.z = startPos.z + (endPos.z - startPos.z) * easeProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        sceneRef.current?.remove(mesh);
      }
    };
    
    animate();
  }, []);

  const dealCards = useCallback(() => {
    const totalCards = gameStateRef.current.players.length * 7;
    let cardIndex = 0;
    
    const dealNextCard = () => {
      if (cardIndex >= totalCards) {
        setDealingAnimation(false);
        
        let card: Card;
        do {
          card = gameStateRef.current.drawPile.pop()!;
        } while (card.type === 'wild');
        
        gameStateRef.current.currentCard = card;
        gameStateRef.current.discardPile.push(card);
        setCurrentCard(card);
        addCardToTable(card);
        
        gameStateRef.current.currentPlayer = 0;
        gameStateRef.current.gameDirection = 1;
        gameStateRef.current.gameEnded = false;
        gameStateRef.current.waitingForColorSelection = false;
        
        setCurrentPlayer(0);
        setGameDirection(1);
        setGameEnded(false);
        setWaitingForColorSelection(false);
        setUpdateTrigger(prev => prev + 1);
        
        nextTurn();
        return;
      }
      
      const playerIndex = cardIndex % gameStateRef.current.players.length;
      const card = gameStateRef.current.drawPile.pop()!;
      gameStateRef.current.players[playerIndex].addCard(card);
      
      if (playerIndex > 0) {
        gameStateRef.current.aiPiles[playerIndex - 1].addCard(
          card, 
          sceneRef.current!, 
          cardBackTextureRef.current!
        );
      } else {
        animateCardToPlayer(card);
      }
      
      cardIndex++;
      setTimeout(dealNextCard, 200);
    };
    
    dealNextCard();
  }, [addCardToTable, animateCardToPlayer]);

  const reshuffleDeck = useCallback(() => {
    if (gameStateRef.current.discardPile.length <= 1) return;
    
    const topCard = gameStateRef.current.discardPile.pop()!;
    gameStateRef.current.drawPile = [...gameStateRef.current.discardPile];
    gameStateRef.current.discardPile = [topCard];
    shuffleArray(gameStateRef.current.drawPile);
    setDrawPile([...gameStateRef.current.drawPile]);
    setDiscardPile([topCard]);
    showMessageFunc('🔄 Deck reshuffled!');
  }, [showMessageFunc]);

  const drawCardsFunc = useCallback((playerIndex: number, count: number) => {
    const player = gameStateRef.current.players[playerIndex];
    for (let i = 0; i < count; i++) {
      if (gameStateRef.current.drawPile.length === 0) {
        reshuffleDeck();
      }
      const card = gameStateRef.current.drawPile.pop()!;
      player.addCard(card);
      
      if (playerIndex > 0) {
        gameStateRef.current.aiPiles[playerIndex - 1].addCard(
          card,
          sceneRef.current!,
          cardBackTextureRef.current!
        );
      }
    }
    setUpdateTrigger(prev => prev + 1);
  }, [reshuffleDeck]);

  const handleSpecialCard = useCallback((card: Card) => {
    const state = gameStateRef.current;
    
    switch (card.value) {
      case 'reverse':
        state.gameDirection *= -1;
        setGameDirection(state.gameDirection);
        showMessageFunc('🔄 Direction reversed!');
        break;
      case 'skip':
        showMessageFunc('⏭️ Next player skipped!');
        break;
      case 'draw2':
        const nextPlayer = (state.currentPlayer + state.gameDirection + state.players.length) % state.players.length;
        drawCardsFunc(nextPlayer, 2);
        showMessageFunc(`📥 ${state.players[nextPlayer].name} draws 2 cards!`);
        break;
      case 'wild4':
        const targetPlayer = (state.currentPlayer + state.gameDirection + state.players.length) % state.players.length;
        drawCardsFunc(targetPlayer, 4);
        showMessageFunc(`📥 ${state.players[targetPlayer].name} draws 4 cards!`);
        // Fall through to wild
      case 'wild':
        if (state.currentPlayer === 0) {
          state.waitingForColorSelection = true;
          setWaitingForColorSelection(true);
          setShowColorPicker(true);
        } else {
          state.currentCard!.color = COLORS[Math.floor(Math.random() * COLORS.length)];
          setCurrentCard(state.currentCard);
          showMessageFunc(`🌈 Color changed to ${state.currentCard!.color}!`);
        }
        break;
    }
  }, [showMessageFunc, drawCardsFunc]);

  const endGame = useCallback((winnerPlayer: Player) => {
    gameStateRef.current.gameEnded = true;
    setGameEnded(true);
    setWinner(winnerPlayer);
  }, []);

  const nextTurn = useCallback(() => {
    const state = gameStateRef.current;
    if (state.gameEnded || state.waitingForColorSelection) return;
    
    state.currentPlayer = (state.currentPlayer + state.gameDirection + state.players.length) % state.players.length;
    setCurrentPlayer(state.currentPlayer);
    setUpdateTrigger(prev => prev + 1);

    if (state.players[state.currentPlayer].isAI) {
      setTimeout(() => aiTurn(), 1500);
    }
  }, []);

  const playCard = useCallback((playerIndex: number, card: Card) => {
    const state = gameStateRef.current;
    if (playerIndex !== state.currentPlayer || state.gameEnded || state.waitingForColorSelection) return;

    const player = state.players[playerIndex];
    if (!card.canPlayOn(state.currentCard!)) {
      showMessageFunc('❌ Invalid move! Card does not match.');
      return;
    }

    player.removeCard(card);
    state.discardPile.push(card);
    state.currentCard = card;
    setCurrentCard(card);

    addCardToTable(card);
    handleSpecialCard(card);

    if (player.hasWon()) {
      endGame(player);
      return;
    }

    if (player.hasUno()) {
      showMessageFunc(`🎯 ${player.name} has UNO!`);
    }

    setUpdateTrigger(prev => prev + 1);
    
    if (card.value !== 'skip') {
      nextTurn();
    } else {
      nextTurn();
      setTimeout(() => nextTurn(), 100);
    }
  }, [showMessageFunc, addCardToTable, handleSpecialCard, endGame, nextTurn]);

  const aiTurn = useCallback(() => {
    const state = gameStateRef.current;
    if (state.gameEnded) return;
    
    const player = state.players[state.currentPlayer];
    const playableCards = player.getPlayableCards(state.currentCard!);

    if (playableCards.length > 0) {
      const cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
      playCard(state.currentPlayer, cardToPlay);
      
      if (state.currentPlayer > 0) {
        state.aiPiles[state.currentPlayer - 1].removeCard(sceneRef.current!);
        state.aiPiles[state.currentPlayer - 1].updateCards();
      }
    } else {
      drawCardsFunc(state.currentPlayer, 1);
      showMessageFunc(`📥 ${player.name} draws a card.`);
      
      const drawnCard = player.hand[player.hand.length - 1];
      if (drawnCard.canPlayOn(state.currentCard!)) {
        setTimeout(() => {
          playCard(state.currentPlayer, drawnCard);
          
          if (state.currentPlayer > 0) {
            state.aiPiles[state.currentPlayer - 1].removeCard(sceneRef.current!);
            state.aiPiles[state.currentPlayer - 1].updateCards();
          }
        }, 1000);
      } else {
        setTimeout(() => {
          nextTurn();
        }, 1000);
      }
    }
  }, [playCard, drawCardsFunc, showMessageFunc, nextTurn]);

  const selectWildColor = useCallback((color: CardColor) => {
    const state = gameStateRef.current;
    state.currentCard!.color = color;
    setCurrentCard(state.currentCard);
    showMessageFunc(`🌈 Color changed to ${color}!`);
    state.waitingForColorSelection = false;
    setWaitingForColorSelection(false);
    setShowColorPicker(false);
    setUpdateTrigger(prev => prev + 1);
  }, [showMessageFunc]);

  const initializeGame = useCallback(() => {
    if (!sceneRef.current || !cardBackTextureRef.current) return;

    // Clear previous game
    gameStateRef.current.tableCards.forEach(({ mesh }) => {
      sceneRef.current?.remove(mesh);
    });
    gameStateRef.current.tableCards = [];
    setTableCards([]);

    gameStateRef.current.aiPiles.forEach(pile => {
      pile.clear(sceneRef.current!);
    });
    gameStateRef.current.aiPiles = [];
    setAiPiles([]);

    // Create deck
    const newDrawPile: Card[] = [];
    
    COLORS.forEach(color => {
      NUMBERS.forEach(number => {
        newDrawPile.push(new Card(color, number, 'number'));
        if (number !== '0') {
          newDrawPile.push(new Card(color, number, 'number'));
        }
      });
    });

    COLORS.forEach(color => {
      ACTIONS.forEach(action => {
        newDrawPile.push(new Card(color, action, 'action'));
        newDrawPile.push(new Card(color, action, 'action'));
      });
    });

    for (let i = 0; i < 4; i++) {
      newDrawPile.push(new Card('wild', 'wild', 'wild'));
      newDrawPile.push(new Card('wild', 'wild4', 'wild'));
    }

    shuffleArray(newDrawPile);
    gameStateRef.current.drawPile = newDrawPile;
    setDrawPile(newDrawPile);

    const newPlayers = [
      new Player('You', false, {x: 0, z: 8}),
      new Player('AI 1', true, {x: 0, z: -8}),
      new Player('AI 2', true, {x: -10, z: 0}),
      new Player('AI 3', true, {x: 10, z: 0})
    ];
    gameStateRef.current.players = newPlayers;
    setPlayers(newPlayers);

    const newAiPiles: AICardPile[] = [];
    for (let i = 1; i < newPlayers.length; i++) {
      const pile = new AICardPile(i, newPlayers[i].position, sceneRef.current);
      newAiPiles.push(pile);
    }
    gameStateRef.current.aiPiles = newAiPiles;
    setAiPiles(newAiPiles);

    setDealingAnimation(true);
    setGameStarted(true);
    dealCards();
  }, [dealCards]);

  const handleDrawPile = useCallback(() => {
    const state = gameStateRef.current;
    if (state.currentPlayer === 0 && !state.gameEnded && !state.waitingForColorSelection) {
      drawCardsFunc(0, 1);
      
      const drawnCard = state.players[0].hand[state.players[0].hand.length - 1];
      if (!drawnCard.canPlayOn(state.currentCard!)) {
        setTimeout(() => {
          nextTurn();
        }, 1000);
      }
    }
  }, [drawCardsFunc, nextTurn]);

  const handlePlayAgain = useCallback(() => {
    setWinner(null);
    setGameStarted(false);
    setGameEnded(false);
    gameStateRef.current.gameEnded = false;
  }, []);

  return (
    <div className="background-wrapper">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Source Sans Pro', sans-serif;
          background: radial-gradient(circle at center, #ff8c00 0%, #ff4500 20%, #dc2626 40%, #8b0000 80%, #000000 100%);
          overflow: hidden;
          color: white;
        }

        .background-wrapper {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          color: white;
        }

        #gameContainer {
          position: relative;
          width: 100vw;
          height: 100vh;
          z-index: 10;
        }

        #gameCanvas {
          display: block;
        }

        #ui {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }

        #turnIndicators {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 15;
        }

        .turn-label {
          position: absolute;
          padding: 0.65rem 1.35rem;
          border-radius: 18px;
          border: 1px solid rgba(255, 215, 0, 0.35);
          background: linear-gradient(235deg, hsl(45 50% 6% / 0.45), hsl(45 50% 6% / 0) 33%),
                      linear-gradient(45deg, hsl(0 50% 6% / 0.45), hsl(0 50% 6% / 0) 33%),
                      linear-gradient(hsl(220deg 25% 4.8% / 0.35));
          color: #ffd700;
          font-family: 'Source Sans Pro', sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
          opacity: 0.35;
          transition: opacity 0.3s ease, box-shadow 0.3s ease, border 0.3s ease;
        }

        .turn-label.active {
          opacity: 1;
          border: 2px solid rgba(255, 215, 0, 0.9);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.55);
        }

        #backButtonContainer {
          position: absolute;
          top: 20px;
          right: 20px;
          pointer-events: auto;
          z-index: 20;
        }

        #leftColumn {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          z-index: 20;
          width: 220px;
          pointer-events: none;
        }

        #leftColumn > * {
          pointer-events: auto;
        }

        #gameInfo {
          position: relative;
          background: linear-gradient(235deg, hsl(45 50% 6% / 0.25), hsl(45 50% 6% / 0) 33%), 
                      linear-gradient(45deg, hsl(0 50% 6% / 0.25), hsl(0 50% 6% / 0) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.2));
          padding: 1.25rem;
          border-radius: 22px;
          border: 1px solid hsl(0, 12%, 20%);
          pointer-events: auto;
          backdrop-filter: blur(12px);
          box-shadow: hsl(0 50% 2%) 0px 10px 16px -8px, hsl(0 50% 4%) 0px 20px 36px -14px;
          max-width: 220px;
        }

        #playerHand {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(235deg, hsl(45 50% 6% / 0.25), hsl(45 50% 6% / 0) 33%), 
                      linear-gradient(45deg, hsl(0 50% 6% / 0.25), hsl(0 50% 6% / 0) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.2));
          padding: 1.25rem;
          border-radius: 22px;
          border: 1px solid hsl(0, 12%, 20%);
          pointer-events: auto;
          display: flex;
          gap: 10px;
          max-width: 90%;
          overflow-x: auto;
          backdrop-filter: blur(12px);
          box-shadow: hsl(0 50% 2%) 0px 10px 16px -8px, hsl(0 50% 4%) 0px 20px 36px -14px;
        }

        .card-button {
          width: 60px;
          height: 90px;
          border: 2px solid white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          font-family: 'Source Sans Pro', sans-serif;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .card-button:hover {
          transform: translateY(-10px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
        }

        .card-button.red { background: linear-gradient(135deg, #ff4444, #cc0000); }
        .card-button.yellow { background: linear-gradient(135deg, #ffff44, #ffcc00); color: #333; }
        .card-button.green { background: linear-gradient(135deg, #44ff44, #00cc00); color: #333; }
        .card-button.blue { background: linear-gradient(135deg, #4444ff, #0000cc); }
        .card-button.wild { 
          background: linear-gradient(45deg, #ff4444 25%, #ffff44 25%, #ffff44 50%, #44ff44 50%, #44ff44 75%, #4444ff 75%);
        }

        .uno-logo {
          position: absolute;
          top: 2px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 8px;
          font-weight: bold;
          color: white;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        }

        #currentCard {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          background: linear-gradient(235deg, hsl(45 50% 6% / 0.25), hsl(45 50% 6% / 0) 33%), 
                      linear-gradient(45deg, hsl(0 50% 6% / 0.25), hsl(0 50% 6% / 0) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.2));
          padding: 1.25rem;
          border-radius: 22px;
          pointer-events: auto;
          backdrop-filter: blur(12px);
          border: 2px solid #ffd700;
          box-shadow: hsl(0 50% 2%) 0px 10px 16px -8px, hsl(0 50% 4%) 0px 20px 36px -14px;
          width: 150px;
        }

        .current-card-large {
          width: 100px;
          height: 150px;
          border: 3px solid white;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
          font-family: 'Source Sans Pro', sans-serif;
        }

        .current-card-large.red { background: linear-gradient(135deg, #ff4444, #cc0000); }
        .current-card-large.yellow { background: linear-gradient(135deg, #ffff44, #ffcc00); color: #333; }
        .current-card-large.green { background: linear-gradient(135deg, #44ff44, #00cc00); color: #333; }
        .current-card-large.blue { background: linear-gradient(135deg, #4444ff, #0000cc); }
        .current-card-large.wild { 
          background: linear-gradient(45deg, #ff4444 25%, #ffff44 25%, #ffff44 50%, #44ff44 50%, #44ff44 75%, #4444ff 75%);
        }

        .current-card-large .uno-logo {
          font-size: 10px;
          top: 5px;
        }

        .current-card-large .card-symbol {
          font-size: 28px;
          margin: 8px 0;
        }

        .current-card-large .card-value {
          font-size: 20px;
          font-weight: bold;
        }

        .card-info {
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #ffd700;
          font-family: 'Source Sans Pro', sans-serif;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          letter-spacing: 0.05em;
        }

        #drawPile {
          position: relative;
          background: linear-gradient(235deg, hsl(45 50% 6% / 0.25), hsl(45 50% 6% / 0) 33%), 
                      linear-gradient(45deg, hsl(0 50% 6% / 0.25), hsl(0 50% 6% / 0) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.2));
          padding: 1.15rem 1.25rem;
          border-radius: 22px;
          border: 1px solid hsl(0, 12%, 20%);
          cursor: pointer;
          pointer-events: auto;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(12px);
          width: 100%;
          text-align: center;
          box-shadow: hsl(0 50% 2%) 0px 10px 16px -8px, hsl(0 50% 4%) 0px 20px 36px -14px;
        }

        #drawPile:hover {
          transform: translateY(-6px);
          box-shadow: hsl(0 50% 8%) 0px 12px 20px -10px, hsl(0 50% 12%) 0px 22px 40px -16px;
        }

        #gameMessage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(235deg, hsl(45 50% 6% / 0.95), hsl(45 50% 6% / 0) 33%), 
                      linear-gradient(45deg, hsl(0 50% 6% / 0.95), hsl(0 50% 6% / 0) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.9));
          padding: 1.75rem 2rem;
          border-radius: 22px;
          border: 2px solid #ffd700;
          text-align: center;
          font-size: 20px;
          font-family: 'Source Sans Pro', sans-serif;
          font-weight: 600;
          letter-spacing: 0.05em;
          display: ${gameMessage ? 'block' : 'none'};
          pointer-events: auto;
          backdrop-filter: blur(12px);
          box-shadow: hsl(0 50% 2%) 0px 10px 16px -8px, hsl(0 50% 4%) 0px 20px 36px -14px, 0 0 20px rgba(255, 215, 0, 0.3);
          max-width: 80%;
        }

        #startButton {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg in oklch, hsl(0 80% 50% / 0.95), hsl(0 85% 55% / 0.95) 50%, hsl(0 75% 48% / 0.95));
          color: white;
          border: 2px solid hsl(0 70% 40%);
          padding: 1.5rem 2.5rem;
          font-size: 1.25rem;
          font-family: 'Source Sans Pro', sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          border-radius: 22px;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 28px rgba(220, 38, 38, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        #startButton:hover {
          background: linear-gradient(135deg in oklch, hsl(0 85% 55% / 1), hsl(0 90% 60% / 1) 50%, hsl(0 80% 52% / 1));
          transform: translate(-50%, -50%) scale(1.05);
          box-shadow: 0 12px 36px rgba(220, 38, 38, 0.7), 0 6px 16px rgba(0, 0, 0, 0.5);
          border-color: hsl(0 80% 45%);
        }

        .player-info {
          margin: 8px 0;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 14px;
          font-family: 'Source Sans Pro', sans-serif;
          font-weight: 600;
          letter-spacing: 0.03em;
        }

        .current-turn {
          background: rgba(255, 215, 0, 0.3);
          border: 2px solid #ffd700;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
        }

        #gameOverScreen {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(235deg, hsl(45 50% 6% / 0.95), hsl(45 50% 6% / 0) 33%), 
                      linear-gradient(45deg, hsl(0 50% 6% / 0.95), hsl(0 50% 6% / 0) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.95));
          display: ${winner ? 'flex' : 'none'};
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        #winnerText {
          font-size: 2.5rem;
          color: #ffd700;
          font-family: 'Source Sans Pro', sans-serif;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(255, 215, 0, 0.5);
          margin-bottom: 2rem;
          animation: glow 2s ease-in-out infinite alternate;
          text-align: center;
        }

        @keyframes glow {
          from { text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 20px #ffd700, 0 0 30px #ffd700; }
          to { text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 30px #ffd700, 0 0 40px #ffd700, 0 0 50px #ffd700; }
        }

        #playAgainButton {
          padding: 1.25rem 2rem;
          font-size: 1.125rem;
          font-family: 'Source Sans Pro', sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          background: linear-gradient(135deg in oklch, hsl(0 80% 50% / 0.95), hsl(0 85% 55% / 0.95) 50%, hsl(0 75% 48% / 0.95));
          color: white;
          border: 2px solid hsl(0 70% 40%);
          border-radius: 22px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 28px rgba(220, 38, 38, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        #playAgainButton:hover {
          background: linear-gradient(135deg in oklch, hsl(0 85% 55% / 1), hsl(0 90% 60% / 1) 50%, hsl(0 80% 52% / 1));
          transform: scale(1.05);
          box-shadow: 0 12px 36px rgba(220, 38, 38, 0.7), 0 6px 16px rgba(0, 0, 0, 0.5);
          border-color: hsl(0 80% 45%);
        }

        .card-value {
          font-size: 16px;
          font-family: 'Source Sans Pro', sans-serif;
          font-weight: 700;
          margin-top: 3px;
        }

        .card-symbol {
          font-size: 20px;
          margin-bottom: 3px;
        }

        #colorPicker {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(235deg, hsl(45 50% 6% / 0.95), hsl(45 50% 6% / 0) 33%), 
                      linear-gradient(45deg, hsl(0 50% 6% / 0.95), hsl(0 50% 6% / 0) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.9));
          padding: 2rem;
          border-radius: 22px;
          border: 2px solid #ffd700;
          display: ${showColorPicker ? 'flex' : 'none'};
          flex-direction: column;
          align-items: center;
          pointer-events: auto;
          backdrop-filter: blur(12px);
          box-shadow: hsl(0 50% 2%) 0px 10px 16px -8px, hsl(0 50% 4%) 0px 20px 36px -14px, 0 0 20px rgba(255, 215, 0, 0.3);
          z-index: 50;
        }

        #colorPicker h3 {
          margin-bottom: 1.25rem;
          color: #ffd700;
          font-size: 1.5rem;
          font-family: 'Source Sans Pro', sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }

        .color-options {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .color-button {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-family: 'Source Sans Pro', sans-serif;
          font-size: 14px;
          letter-spacing: 0.05em;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .color-button:hover {
          transform: scale(1.15);
          box-shadow: 0 8px 20px rgba(0,0,0,0.5);
        }

        .color-button.red { 
          background: linear-gradient(135deg, #ff4444, #cc0000);
          color: white;
        }
        .color-button.yellow { 
          background: linear-gradient(135deg, #ffff44, #ffcc00);
          color: #333;
        }
        .color-button.green { 
          background: linear-gradient(135deg, #44ff44, #00cc00);
          color: #333;
        }
        .color-button.blue { 
          background: linear-gradient(135deg, #4444ff, #0000cc);
          color: white;
        }

        #dealingMessage {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(235deg, hsl(45 50% 6% / 0.95), hsl(45 50% 6% / 0) 33%), 
                      linear-gradient(45deg, hsl(0 50% 6% / 0.95), hsl(0 50% 6% / 0) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.9));
          padding: 1.75rem 2.5rem;
          border-radius: 22px;
          border: 2px solid #ffd700;
          text-align: center;
          font-size: 1.5rem;
          font-family: 'Source Sans Pro', sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #ffd700;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          pointer-events: none;
          z-index: 20;
          box-shadow: hsl(0 50% 2%) 0px 10px 16px -8px, hsl(0 50% 4%) 0px 20px 36px -14px, 0 0 20px rgba(255, 215, 0, 0.3);
          backdrop-filter: blur(12px);
          display: ${dealingAnimation ? 'block' : 'none'};
        }
      `}</style>

    <div className="spiral-background" />
    <GalaxySpiral />
    <ParticleCanvas />
    <UnoCardsBackground />

      <div id="gameContainer">
        <canvas ref={canvasRef} id="gameCanvas" />
        <div id="ui">
          <div id="turnIndicators">
            {players.map((player, index) => {
              const position = turnIndicatorStyles[index] ?? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              };

              return (
                <div
                  key={player.name}
                  className={`turn-label ${index === currentPlayer ? 'active' : ''}`}
                  style={position}
                >
                  {player.name}
                </div>
              );
            })}
          </div>

          <div id="backButtonContainer">
            <Button
              type="button"
              className="glass-button glass-button-secondary"
              onClick={handleBack}
            >
              ⬅ VOLVER
            </Button>
          </div>

          <div id="leftColumn">
            <div id="gameInfo">
              <h2>🎴 UNO 3D Game 🎴</h2>
              <div id="playersInfo">
                {players.map((player, index) => (
                  <div key={index} className={`player-info ${index === currentPlayer ? 'current-turn' : ''}`}>
                    <strong>{player.name}</strong><br />
                    Cards: {player.hand.length}
                    {player.hasUno() ? ' - 🎯 UNO!' : ''}
                  </div>
                ))}
              </div>
              <div id="turnInfo">
                {players.length > 0 && (
                  <>
                    <strong>Current Turn: {players[currentPlayer]?.name}</strong><br />
                    Direction: {gameDirection === 1 ? '↻ Clockwise' : '↺ Counter-clockwise'}
                  </>
                )}
              </div>
            </div>
            
            <div id="drawPile" onClick={handleDrawPile}>
              <h3>🎯 Draw Pile</h3>
              <div id="drawPileCount">{drawPile.length} cards</div>
            </div>
          </div>
          
          <div id="currentCard">
            <h3>Current Card</h3>
            <div id="currentCardDisplay">
              {currentCard && (
                <>
                  <div className={`current-card-large ${currentCard.color}`}>
                    <div className="uno-logo">UNO</div>
                    <div className="card-symbol">{getCardSymbol(currentCard.value)}</div>
                    <div className="card-value">{currentCard.value.toUpperCase()}</div>
                  </div>
                  <div className="card-info">
                    Color: {currentCard.color.charAt(0).toUpperCase() + currentCard.color.slice(1)}<br />
                    Card: {currentCard.value.toUpperCase()}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div id="playerHand">
            {currentPlayer === 0 && !gameEnded && !waitingForColorSelection && players[0]?.hand.map((card, index) => (
              <div key={index} className={`card-button ${card.color}`} onClick={() => playCard(0, card)}>
                <div className="uno-logo">UNO</div>
                <div className="card-symbol">{getCardSymbol(card.value)}</div>
                <div className="card-value">{card.value.toUpperCase()}</div>
              </div>
            ))}
          </div>
          
          <div id="gameMessage">{gameMessage}</div>
          <div id="dealingMessage">Dealing Cards...</div>
          
          {!gameStarted && (
            <button id="startButton" onClick={initializeGame}>
              🚀 Start Game
            </button>
          )}
        </div>

        <div id="colorPicker">
          <h3>Choose a Color</h3>
          <div className="color-options">
            {COLORS.map(color => (
              <div key={color} className={`color-button ${color}`} onClick={() => selectWildColor(color)}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </div>
            ))}
          </div>
        </div>

        <div id="gameOverScreen">
          <div id="winnerText">
            {winner && (
              <>
                🎉 Congratulations! 🎉<br />
                {winner.name} Won the Game!<br />
                <span style={{ fontSize: '24px' }}>🏆 UNO Champion! 🏆</span>
              </>
            )}
          </div>
          <button id="playAgainButton" onClick={handlePlayAgain}>
            🔄 Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnoGame3D;