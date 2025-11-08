"use client"

import { useEffect, useRef } from 'react'

export default function UnoCardsBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;

    const handleResize = () => {
      centerX = window.innerWidth / 2;
      centerY = window.innerHeight / 2;
    }

    const randomColor = () => ['blue', 'red', 'green', 'yellow'][Math.floor(Math.random() * 4)];

    const colors = new Map();
    colors.set('blue', '0063B3');
    colors.set('red', 'C72A18');
    colors.set('green', '18A849');
    colors.set('yellow', 'E6CA1E');

    class Card {
      x: number = 0
      y: number = 0
      vx: number = 0
      vy: number = 0
      scale: number = 1
      rotation: number = 0
      rotSpeed: number = 0
      scaleRate: number = 0.003
      width: number = 225
      height: number = 320
      value: string = ''
      color: string = ''
      type: string = ''
      element: HTMLDivElement

      constructor() {
        const types = [
          // Solo cartas numéricas
          { type: 'number', value: '0', color: randomColor(), weight: 1 },
          { type: 'number', value: '1', color: randomColor(), weight: 2 },
          { type: 'number', value: '2', color: randomColor(), weight: 2 },
          { type: 'number', value: '3', color: randomColor(), weight: 2 },
          { type: 'number', value: '4', color: randomColor(), weight: 2 },
          { type: 'number', value: '5', color: randomColor(), weight: 2 },
          { type: 'number', value: '6', color: randomColor(), weight: 2 },
          { type: 'number', value: '7', color: randomColor(), weight: 2 },
          { type: 'number', value: '8', color: randomColor(), weight: 2 },
          { type: 'number', value: '9', color: randomColor(), weight: 2 }
        ];
        
        // Selección ponderada
        const weightedTypes: any[] = [];
        types.forEach(type => {
          const count = Math.ceil(type.weight * 10);
          for (let i = 0; i < count; i++) {
            weightedTypes.push(type);
          }
        });
        
        const randomType = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
        this.value = randomType.value;
        this.color = randomType.color;
        this.type = randomType.type;

        this.width = 225;
        this.height = 320;

        // Posición inicial aleatoria en los bordes
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
          case 0: // top
            this.x = Math.random() * window.innerWidth;
            this.y = -this.height / 2 - 50;
            break;
          case 1: // right
            this.x = window.innerWidth + this.width / 2 + 50;
            this.y = Math.random() * window.innerHeight;
            break;
          case 2: // bottom
            this.x = Math.random() * window.innerWidth;
            this.y = window.innerHeight + this.height / 2 + 50;
            break;
          case 3: // left
            this.x = -this.width / 2 - 50;
            this.y = Math.random() * window.innerHeight;
            break;
        }

        // Propiedades de animación
        this.scale = 1;
        this.rotation = 0;
        this.rotSpeed = (Math.random() - 0.5) * 0.05; // Rotación más lenta

        // Velocidad hacia el centro (más lenta)
        let dx = centerX - this.x;
        let dy = centerY - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 2.5; // Velocidad reducida
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;

        this.scaleRate = 0.003; // Escala más lenta

        // Crear elemento DOM
        this.element = this.createCardElement();
        container!.appendChild(this.element);

        // Posición inicial
        this.element.style.transform = `translate(${this.x - this.width / 2}px, ${this.y - this.height / 2}px) rotate(${this.rotation}rad) scale(${this.scale})`;
      }

      createCardElement() {
        const card = document.createElement('div');
        
        // Solo cartas numéricas
        card.className = `card num-${this.value} ${this.color}`;
        const inner = document.createElement('span');
        inner.className = 'inner';
        inner.style.backgroundColor = `#${colors.get(this.color)}`;
        
        const mark = document.createElement('span');
        mark.className = 'mark';
        mark.textContent = this.value;
        
        inner.appendChild(mark);
        card.appendChild(inner);
        
        return card;
      }

      update() {
        // Movimiento hacia el centro (más lento)
        let dx = centerX - this.x;
        let dy = centerY - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 30) {
          const speed = 2.5; // Velocidad más lenta
          this.vx = (dx / dist) * speed;
          this.vy = (dy / dist) * speed;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        this.scale -= this.scaleRate;

        this.element.style.transform = `translate(${this.x - this.width / 2}px, ${this.y - this.height / 2}px) rotate(${this.rotation}rad) scale(${this.scale})`;

        if (this.scale <= 0.05 || dist < 20) {
          this.element.remove();
          return false;
        }
        return true;
      }
    }

    let cards: Card[] = [];
    let animationFrameId: number
    let intervalId: NodeJS.Timeout
    let isPageVisible = true

    const createCard = () => {
      if (isPageVisible) {
        cards.push(new Card());
      }
    }

    const animate = () => {
      if (isPageVisible) {
        cards = cards.filter(card => card.update());
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      
      if (!isPageVisible) {
        // Cuando la página se oculta, limpiamos todas las cartas
        cards.forEach(card => card.element.remove());
        cards = [];
      }
    }

    const handlePageFocus = () => {
      isPageVisible = true;
      // Limpiamos cartas acumuladas cuando volvemos al foco
      cards.forEach(card => card.element.remove());
      cards = [];
    }

    const handlePageBlur = () => {
      isPageVisible = false;
      // Limpiamos cartas cuando perdemos el foco
      cards.forEach(card => card.element.remove());
      cards = [];
    }

    // Iniciar animación
    intervalId = setInterval(createCard, 1500); // Frecuencia más lenta
    animate();

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handlePageFocus);
    window.addEventListener('blur', handlePageBlur);

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handlePageFocus);
      window.removeEventListener('blur', handlePageBlur);
      clearInterval(intervalId)
      cancelAnimationFrame(animationFrameId)
      cards.forEach(card => card.element.remove())
    }
  }, [])

  return <div ref={containerRef} className="uno-cards-container" />
}