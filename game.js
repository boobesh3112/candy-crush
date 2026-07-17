/**
 * Candy Delight - Match 3 Game Engine
 * Features: Web Audio API sound synthesis, Level management, Candy falls, Combos, Haptics, and particle canvas.
 */

// ==========================================
// 1. SOUND MANAGER (WEB AUDIO SYNTHESIS)
// ==========================================
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Helper to create oscillators and nodes
  playTone(freqStart, freqEnd, duration, type = 'sine', gainStart = 0.1, delay = 0) {
    if (this.muted) return;
    this.init();
    
    const time = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, time);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, time + duration);
    }

    gainNode.gain.setValueAtTime(gainStart, time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  playSwap() {
    // Whoosh / Swipe sound
    this.playTone(300, 150, 0.15, 'triangle', 0.15);
  }

  playPop(combo = 0) {
    // Pop sound that increases in pitch with cascades
    const baseFreq = 220;
    // Scale steps for combos (pentatonic major)
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const index = Math.min(combo, scale.length - 1);
    const multiplier = Math.pow(2, scale[index] / 12);
    const freq = baseFreq * multiplier;

    this.playTone(freq, freq * 1.5, 0.1, 'sine', 0.25);
  }

  playSpecial() {
    // Synth sweep for special candies
    this.playTone(150, 800, 0.35, 'sawtooth', 0.15);
    this.playTone(800, 100, 0.35, 'sine', 0.2, 0.05);
  }

  playError() {
    // Buzzy low frequency vibration tone
    this.playTone(130, 90, 0.25, 'square', 0.2);
  }

  playVictory() {
    // Playful major chord progression
    const chord = [261.63, 329.63, 392.00, 523.25]; // C major
    chord.forEach((freq, i) => {
      this.playTone(freq, freq, 0.6, 'triangle', 0.1, i * 0.1);
    });
    // Final sparkling notes
    this.playTone(523.25, 1046.50, 0.4, 'sine', 0.15, 0.4);
  }

  playDefeat() {
    // Sad descending notes
    const chord = [392.00, 311.13, 261.63, 196.00]; // C minor descending
    chord.forEach((freq, i) => {
      this.playTone(freq, freq * 0.9, 0.5, 'sawtooth', 0.08, i * 0.15);
    });
  }
}

const sounds = new SoundManager();

// ==========================================
// 2. LEVEL CONFIGURATION DATA
// ==========================================
const LEVELS = [
  {
    id: 1,
    title: "Sweet Beginnings",
    width: 6,
    height: 6,
    moves: 22,
    targetScore: 1000,
    starMilestones: [600, 1000, 1500],
    boardLayout: [
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 2,
    title: "Jelly Jubilee",
    width: 7,
    height: 7,
    moves: 25,
    targetScore: 2000,
    starMilestones: [1200, 2000, 3000],
    boardLayout: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 2, 2, 2, 1, 1],
      [1, 1, 2, 2, 2, 1, 1],
      [1, 1, 2, 2, 2, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ] // 2: Single Jelly
  },
  {
    id: 3,
    title: "Double Glaze",
    width: 7,
    height: 7,
    moves: 28,
    targetScore: 3500,
    starMilestones: [2000, 3500, 5000],
    boardLayout: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 3, 1, 1, 1, 3, 1],
      [1, 1, 3, 3, 3, 1, 1],
      [1, 1, 3, 2, 3, 1, 1],
      [1, 1, 3, 3, 3, 1, 1],
      [1, 3, 1, 1, 1, 3, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ] // 3: Double Jelly
  },
  {
    id: 4,
    title: "Chocolate Hole",
    width: 8,
    height: 8,
    moves: 24,
    targetScore: 4000,
    starMilestones: [2500, 4000, 6000],
    boardLayout: [
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 2, 2, 2, 2, 1, 1],
      [1, 1, 2, 0, 0, 2, 1, 1],
      [1, 1, 2, 0, 0, 2, 1, 1],
      [1, 1, 2, 2, 2, 2, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0]
    ] // 0: Hole (Unplayable block)
  },
  {
    id: 5,
    title: "Jelly Castle",
    width: 8,
    height: 8,
    moves: 30,
    targetScore: 5000,
    starMilestones: [3000, 5000, 7500],
    boardLayout: [
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 3, 3, 3, 3, 3, 3, 1],
      [0, 3, 1, 1, 1, 1, 3, 0],
      [1, 3, 1, 3, 3, 1, 3, 1],
      [1, 3, 1, 3, 3, 1, 3, 1],
      [0, 3, 1, 1, 1, 1, 3, 0],
      [1, 3, 3, 3, 3, 3, 3, 1],
      [1, 1, 0, 1, 1, 0, 1, 1]
    ]
  },
  {
    id: 6,
    title: "The Big Board",
    width: 9,
    height: 9,
    moves: 35,
    targetScore: 8000,
    starMilestones: [5000, 8000, 12000],
    boardLayout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 2, 2, 2, 2, 2, 1, 1],
      [1, 1, 2, 3, 3, 3, 2, 1, 1],
      [1, 1, 2, 3, 0, 3, 2, 1, 1],
      [1, 1, 2, 3, 3, 3, 2, 1, 1],
      [1, 1, 2, 2, 2, 2, 2, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 7,
    title: "Divide & Conquer",
    width: 8,
    height: 8,
    moves: 26,
    targetScore: 7000,
    starMilestones: [4000, 7000, 10000],
    boardLayout: [
      [1, 1, 1, 0, 0, 1, 1, 1],
      [1, 2, 1, 0, 0, 1, 2, 1],
      [1, 2, 2, 1, 1, 2, 2, 1],
      [1, 1, 2, 2, 2, 2, 1, 1],
      [1, 1, 2, 2, 2, 2, 1, 1],
      [1, 2, 2, 1, 1, 2, 2, 1],
      [1, 2, 1, 0, 0, 1, 2, 1],
      [1, 1, 1, 0, 0, 1, 1, 1]
    ]
  },
  {
    id: 8,
    title: "Islands of Sweetness",
    width: 9,
    height: 9,
    moves: 32,
    targetScore: 10000,
    starMilestones: [6000, 10000, 15000],
    boardLayout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 1, 3, 3, 3, 3, 3, 1, 1],
      [1, 1, 3, 0, 3, 0, 3, 1, 1],
      [1, 0, 3, 3, 3, 3, 3, 0, 1],
      [1, 1, 3, 0, 3, 0, 3, 1, 1],
      [1, 1, 3, 3, 3, 3, 3, 1, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 9,
    title: "Hourglass",
    width: 8,
    height: 8,
    moves: 28,
    targetScore: 9000,
    starMilestones: [5500, 9000, 13000],
    boardLayout: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [0, 0, 0, 3, 3, 0, 0, 0],
      [0, 0, 0, 3, 3, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 10,
    title: "Ultimate Crush",
    width: 9,
    height: 9,
    moves: 38,
    targetScore: 15000,
    starMilestones: [9000, 15000, 22000],
    boardLayout: [
      [3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 1, 1, 1, 1, 1, 1, 1, 3],
      [3, 1, 0, 1, 1, 1, 0, 1, 3],
      [3, 1, 1, 2, 2, 2, 1, 1, 3],
      [3, 1, 1, 2, 0, 2, 1, 1, 3],
      [3, 1, 1, 2, 2, 2, 1, 1, 3],
      [3, 1, 0, 1, 1, 1, 0, 1, 3],
      [3, 1, 1, 1, 1, 1, 1, 1, 3],
      [3, 3, 3, 3, 3, 3, 3, 3, 3]
    ]
  }
];

// Candy type count (number of colors)
const CANDY_TYPES = 6;
// Special Type Enums
const SPECIAL_NONE = null;
const SPECIAL_STRIPED_H = 'striped-h';
const SPECIAL_STRIPED_V = 'striped-v';
const SPECIAL_WRAPPED = 'wrapped';
const SPECIAL_BOMB = 'bomb';

// ==========================================
// 3. CANVAS PARTICLE SYSTEM
// ==========================================
class EffectSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.active = false;
    this.resize();
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  addSparkles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        type: 'sparkle',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: color,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        gravity: 0.1
      });
    }
    this.start();
  }

  addBlast(x, y, radius = 50, color = '#ffffff') {
    this.particles.push({
      type: 'ring',
      x: x,
      y: y,
      radius: 5,
      maxRadius: radius,
      color: color,
      life: 1.0,
      decay: 0.04
    });
    
    // Add sprinkles too
    this.addSparkles(x, y, color, 18);
    this.start();
  }

  start() {
    if (!this.active) {
      this.active = true;
      this.loop();
    }
  }

  loop() {
    if (!this.active) return;
    this.update();
    this.draw();

    if (this.particles.length === 0) {
      this.active = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      requestAnimationFrame(() => this.loop());
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      if (p.type === 'sparkle') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity; // Gravity pull
      } else if (p.type === 'ring') {
        p.radius += (p.maxRadius - p.radius) * 0.15;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      
      if (p.type === 'sparkle') {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        // Star-like shape
        const r = p.radius * p.life;
        this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'ring') {
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 4 * p.life;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    });
  }
}

// Map color strings to hex for particle effects
const CANDY_HEX_COLORS = [
  '#ff1a40', // Red
  '#1abaff', // Blue
  '#4bff1a', // Green
  '#ffd01a', // Yellow
  '#ff731a', // Orange
  '#af1aff'  // Purple
];

// ==========================================
// 4. BOARD ENGINE CLASS
// ==========================================
class Board {
  constructor(level, onStateChange) {
    this.level = level;
    this.width = level.width;
    this.height = level.height;
    
    // Grid: contains either candy objects or null
    this.grid = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
    
    // Jelly Grid: 0 = no jelly, 1 = single jelly, 2 = double jelly
    this.jellyGrid = Array(this.height).fill(0).map(() => Array(this.width).fill(0));
    
    // Obstacle Layout: 1 = normal cell, 0 = hole
    this.layout = level.boardLayout;

    this.onStateChange = onStateChange; // callback to update UI
    this.candyIdCounter = 0;
    
    this.initBoard();
  }

  initBoard() {
    // Populate jellies
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (this.layout[r][c] === 2) {
          this.jellyGrid[r][c] = 1; // Single jelly
        } else if (this.layout[r][c] === 3) {
          this.jellyGrid[r][c] = 2; // Double jelly
        }
      }
    }

    // Populate candies, making sure we don't start with any matches!
    do {
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          if (this.layout[r][c] === 0) {
            this.grid[r][c] = null; // hole
          } else {
            this.grid[r][c] = this.createNewCandy(this.getRandomColor(r, c));
          }
        }
      }
    } while (this.hasAnyMatches());
  }

  createNewCandy(colorType, special = SPECIAL_NONE) {
    return {
      id: ++this.candyIdCounter,
      type: colorType, // 0 to 5
      special: special, // null, 'striped-h', 'striped-v', 'wrapped', 'bomb'
      isNew: true
    };
  }

  getRandomColor(row, col) {
    const forbidden = [];
    // Avoid horizontal matches on startup
    if (col >= 2 && this.grid[row][col - 1] && this.grid[row][col - 2]) {
      if (this.grid[row][col - 1].type === this.grid[row][col - 2].type) {
        forbidden.push(this.grid[row][col - 1].type);
      }
    }
    // Avoid vertical matches on startup
    if (row >= 2 && this.grid[row - 1][col] && this.grid[row - 2][col]) {
      if (this.grid[row - 1][col].type === this.grid[row - 2][col].type) {
        forbidden.push(this.grid[row - 1][col].type);
      }
    }

    const availableColors = [];
    for (let i = 0; i < CANDY_TYPES; i++) {
      if (!forbidden.includes(i)) {
        availableColors.push(i);
      }
    }
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  // Swap check logic
  canSwap(r1, c1, r2, c2) {
    // Check bounds
    if (r1 < 0 || r1 >= this.height || c1 < 0 || c1 >= this.width) return false;
    if (r2 < 0 || r2 >= this.height || c2 < 0 || c2 >= this.width) return false;
    // Check if playable
    if (this.layout[r1][c1] === 0 || this.layout[r2][c2] === 0) return false;
    
    // Check adjacency
    const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    if (dist !== 1) return false;

    const candy1 = this.grid[r1][c1];
    const candy2 = this.grid[r2][c2];
    if (!candy1 || !candy2) return false;

    // Swapping with bombs or combination of specials is always allowed!
    if (candy1.special === SPECIAL_BOMB || candy2.special === SPECIAL_BOMB) return true;
    if (candy1.special && candy2.special) return true;

    // Standard swap: check if it creates any match
    this.swapCandies(r1, c1, r2, c2);
    const hasMatches = this.hasAnyMatches();
    this.swapCandies(r1, c1, r2, c2); // Revert

    return hasMatches;
  }

  swapCandies(r1, c1, r2, c2) {
    const temp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = temp;
  }

  hasAnyMatches() {
    return this.findMatches().length > 0;
  }

  // Scan the entire board for Match-3, 4, 5
  findMatches() {
    const matchedCells = [];
    const rows = this.height;
    const cols = this.width;

    // Keep track of cells in match sets
    const matchGrid = Array(rows).fill(null).map(() => Array(cols).fill(false));

    // Horizontal scan
    for (let r = 0; r < rows; r++) {
      let matchCount = 1;
      let matchColor = -1;
      for (let c = 0; c < cols; c++) {
        const current = this.grid[r][c];
        if (current && current.special !== SPECIAL_BOMB && current.type === matchColor) {
          matchCount++;
        } else {
          if (matchCount >= 3) {
            for (let i = c - matchCount; i < c; i++) {
              matchGrid[r][i] = true;
            }
          }
          matchCount = 1;
          matchColor = current ? current.type : -1;
        }
      }
      if (matchCount >= 3) {
        for (let i = cols - matchCount; i < cols; i++) {
          matchGrid[r][i] = true;
        }
      }
    }

    // Vertical scan
    for (let c = 0; c < cols; c++) {
      let matchCount = 1;
      let matchColor = -1;
      for (let r = 0; r < rows; r++) {
        const current = this.grid[r][c];
        if (current && current.special !== SPECIAL_BOMB && current.type === matchColor) {
          matchCount++;
        } else {
          if (matchCount >= 3) {
            for (let i = r - matchCount; i < r; i++) {
              matchGrid[i][c] = true;
            }
          }
          matchCount = 1;
          matchColor = current ? current.type : -1;
        }
      }
      if (matchCount >= 3) {
        for (let i = rows - matchCount; i < rows; i++) {
          matchGrid[i][c] = true;
        }
      }
    }

    // Collect matching cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matchGrid[r][c]) {
          matchedCells.push({ r, c });
        }
      }
    }

    return matchedCells;
  }

  // Complex Match Analysis (to spawn striped, wrapped, color bomb)
  analyzeAndResolveMatches(swapOrigin = null) {
    const matchedCells = this.findMatches();
    if (matchedCells.length === 0) return { scoreGained: 0, jelliesCleared: 0, specialsCreated: [] };

    const rows = this.height;
    const cols = this.width;

    // Detect structure of matches to assign special candy spawns
    const horizontalRuns = [];
    const verticalRuns = [];
    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));

    // Group horizontal matches
    for (let r = 0; r < rows; r++) {
      let run = [];
      for (let c = 0; c < cols; c++) {
        if (matchedCells.some(cell => cell.r === r && cell.c === c)) {
          if (run.length === 0 || this.grid[r][c].type === this.grid[r][run[0]].type) {
            run.push(c);
          } else {
            if (run.length >= 3) horizontalRuns.push({ r, cols: run });
            run = [c];
          }
        } else {
          if (run.length >= 3) horizontalRuns.push({ r, cols: run });
          run = [];
        }
      }
      if (run.length >= 3) horizontalRuns.push({ r, cols: run });
    }

    // Group vertical matches
    for (let c = 0; c < cols; c++) {
      let run = [];
      for (let r = 0; r < rows; r++) {
        if (matchedCells.some(cell => cell.r === r && cell.c === c)) {
          if (run.length === 0 || this.grid[r][c].type === this.grid[run[0]][c].type) {
            run.push(r);
          } else {
            if (run.length >= 3) verticalRuns.push({ c, rows: run });
            run = [r];
          }
        } else {
          if (run.length >= 3) verticalRuns.push({ c, rows: run });
          run = [];
        }
      }
      if (run.length >= 3) verticalRuns.push({ c, rows: run });
    }

    // Determine target positions for special candy spawns
    // If the swap origin is part of a match, spawn there. Otherwise, pick the intersection or middle of the run.
    const specialsToCreate = [];
    const cellsToDestroy = new Set();
    matchedCells.forEach(cell => cellsToDestroy.add(`${cell.r},${cell.c}`));

    const addToDestroy = (r, c) => {
      if (r >= 0 && r < rows && c >= 0 && c < cols && this.layout[r][c] !== 0) {
        cellsToDestroy.add(`${r},${c}`);
      }
    };

    // 1. Check for Color Bomb (5 in a line)
    horizontalRuns.forEach(run => {
      if (run.cols.length >= 5) {
        let spawnCol = run.cols[2]; // middle
        if (swapOrigin && swapOrigin.r === run.r && run.cols.includes(swapOrigin.c)) spawnCol = swapOrigin.c;
        specialsToCreate.push({ r: run.r, c: spawnCol, type: SPECIAL_BOMB, color: 0 }); // Bombs have color type 0 (chocolate) but are special
      }
    });
    verticalRuns.forEach(run => {
      if (run.rows.length >= 5) {
        let spawnRow = run.rows[2];
        if (swapOrigin && swapOrigin.c === run.c && run.rows.includes(swapOrigin.r)) spawnRow = swapOrigin.r;
        specialsToCreate.push({ r: spawnRow, c: run.c, type: SPECIAL_BOMB, color: 0 });
      }
    });

    // 2. Check for Wrapped Candy (Intersecting L/T-shape)
    // Find matching cells that belong to both a horizontal run and a vertical run
    horizontalRuns.forEach(hRun => {
      verticalRuns.forEach(vRun => {
        // Find if they intersect and have the same candy type
        const hColor = this.grid[hRun.r][hRun.cols[0]]?.type;
        const vColor = this.grid[vRun.rows[0]][vRun.c]?.type;
        
        if (hColor === vColor && hRun.cols.includes(vRun.c) && vRun.rows.includes(hRun.r)) {
          // Intersection!
          specialsToCreate.push({ r: hRun.r, c: vRun.c, type: SPECIAL_WRAPPED, color: hColor });
        }
      });
    });

    // 3. Check for Striped Candy (4 in a line)
    horizontalRuns.forEach(run => {
      if (run.cols.length === 4) {
        // Prevent double spawning if color bomb already handled it
        if (!specialsToCreate.some(s => s.r === run.r && run.cols.includes(s.c))) {
          let spawnCol = run.cols[1];
          if (swapOrigin && swapOrigin.r === run.r && run.cols.includes(swapOrigin.c)) spawnCol = swapOrigin.c;
          specialsToCreate.push({ r: run.r, c: spawnCol, type: SPECIAL_STRIPED_V, color: this.grid[run.r][spawnCol].type }); // Horizontal match creates vertical stripe (per standard Candy Crush)
        }
      }
    });
    verticalRuns.forEach(run => {
      if (run.rows.length === 4) {
        if (!specialsToCreate.some(s => s.c === run.c && run.rows.includes(s.r))) {
          let spawnRow = run.rows[1];
          if (swapOrigin && swapOrigin.c === run.c && run.rows.includes(swapOrigin.r)) spawnRow = swapOrigin.r;
          specialsToCreate.push({ r: spawnRow, c: run.c, type: SPECIAL_STRIPED_H, color: this.grid[spawnRow][run.c].type }); // Vertical match creates horizontal stripe
        }
      }
    });

    // Resolve any special candy triggers within the destroyed set
    const queue = Array.from(cellsToDestroy).map(str => {
      const [r, c] = str.split(',').map(Number);
      return { r, c };
    });

    const triggeredSpecials = new Set();

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      const candy = this.grid[r][c];
      const coordStr = `${r},${c}`;
      
      if (!candy || triggeredSpecials.has(coordStr)) continue;

      if (candy.special) {
        triggeredSpecials.add(coordStr);
        
        if (candy.special === SPECIAL_STRIPED_H) {
          // Clear entire row
          for (let col = 0; col < cols; col++) {
            if (this.layout[r][col] !== 0 && !cellsToDestroy.has(`${r},${col}`)) {
              cellsToDestroy.add(`${r},${col}`);
              queue.push({ r: r, c: col });
            }
          }
        } else if (candy.special === SPECIAL_STRIPED_V) {
          // Clear entire column
          for (let row = 0; row < rows; row++) {
            if (this.layout[row][c] !== 0 && !cellsToDestroy.has(`${row},${c}`)) {
              cellsToDestroy.add(`${row},${c}`);
              queue.push({ r: row, c: c });
            }
          }
        } else if (candy.special === SPECIAL_WRAPPED) {
          // Explode 3x3
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && this.layout[nr][nc] !== 0) {
                const key = `${nr},${nc}`;
                if (!cellsToDestroy.has(key)) {
                  cellsToDestroy.add(key);
                  queue.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      }
    }

    // Now proceed with actual destruction
    let scoreGained = 0;
    let jelliesCleared = 0;

    cellsToDestroy.forEach(coordStr => {
      const [r, c] = coordStr.split(',').map(Number);
      
      // Calculate score based on candy cleared
      const candy = this.grid[r][c];
      if (candy) {
        scoreGained += 60; // base score per candy
        if (candy.special) scoreGained += 120; // bonus score for special triggers
      }

      // Destroy candy
      this.grid[r][c] = null;

      // Clear Jelly
      if (this.jellyGrid[r][c] > 0) {
        this.jellyGrid[r][c]--;
        jelliesCleared++;
      }
    });

    // Create newly spawned specials (replacing null spots)
    specialsToCreate.forEach(s => {
      this.grid[s.r][s.c] = this.createNewCandy(s.color, s.type);
    });

    return {
      scoreGained,
      jelliesCleared,
      destroyedCells: Array.from(cellsToDestroy).map(str => {
        const [r, c] = str.split(',').map(Number);
        return { r, c };
      }),
      specialsCreated: specialsToCreate
    };
  }

  // Activate a specific Color Bomb swap action (e.g. Bomb swapped with Green Candy)
  activateColorBomb(bombR, bombC, otherR, otherC) {
    const otherCandy = this.grid[otherR][otherC];
    const bombCandy = this.grid[bombR][bombC];
    
    let scoreGained = 0;
    let jelliesCleared = 0;
    const destroyedCells = [{ r: bombR, c: bombC }, { r: otherR, c: otherC }];
    
    this.grid[bombR][bombC] = null; // Clear bomb
    
    // Combo 1: Bomb + Bomb -> Clear whole board
    if (otherCandy.special === SPECIAL_BOMB) {
      this.grid[otherR][otherC] = null;
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          if (this.layout[r][c] !== 0) {
            destroyedCells.push({ r, c });
            this.grid[r][c] = null;
            if (this.jellyGrid[r][c] > 0) {
              this.jellyGrid[r][c]--;
              jelliesCleared++;
            }
            scoreGained += 100;
          }
        }
      }
      return { scoreGained, jelliesCleared, destroyedCells };
    }

    const targetColor = otherCandy.type;
    const targetSpecial = otherCandy.special;

    // Combo 2: Bomb + Special -> Convert all targetColor candies to that special and detonate!
    if (targetSpecial === SPECIAL_STRIPED_H || targetSpecial === SPECIAL_STRIPED_V || targetSpecial === SPECIAL_WRAPPED) {
      this.grid[otherR][otherC] = null;
      
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          const candy = this.grid[r][c];
          if (candy && candy.type === targetColor) {
            // Convert to special
            const randSpecial = targetSpecial === SPECIAL_WRAPPED ? SPECIAL_WRAPPED : (Math.random() > 0.5 ? SPECIAL_STRIPED_H : SPECIAL_STRIPED_V);
            candy.special = randSpecial;
            destroyedCells.push({ r, c });
          }
        }
      }
      
      // The scan & resolve step will automatically detonate them!
      return { scoreGained: 200, jelliesCleared: 0, destroyedCells };
    }

    // Standard Bomb: Clear all candies of targeted color
    this.grid[otherR][otherC] = null; // Clear swapped candy
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const candy = this.grid[r][c];
        if (candy && candy.type === targetColor) {
          destroyedCells.push({ r, c });
          this.grid[r][c] = null;
          if (this.jellyGrid[r][c] > 0) {
            this.jellyGrid[r][c]--;
            jelliesCleared++;
          }
          scoreGained += 80;
        }
      }
    }

    return { scoreGained, jelliesCleared, destroyedCells };
  }

  // Activate two adjacent special candies (e.g. Striped + Wrapped)
  activateSpecialCombo(r1, c1, r2, c2) {
    const c1Special = this.grid[r1][c1].special;
    const c2Special = this.grid[r2][c2].special;
    
    let scoreGained = 300;
    let jelliesCleared = 0;
    const destroyedCells = [];

    const clearCell = (r, c) => {
      if (r >= 0 && r < this.height && c >= 0 && c < this.width && this.layout[r][c] !== 0) {
        destroyedCells.push({ r, c });
        this.grid[r][c] = null;
        if (this.jellyGrid[r][c] > 0) {
          this.jellyGrid[r][c]--;
          jelliesCleared++;
        }
      }
    };

    // Clear origin points
    clearCell(r1, c1);
    clearCell(r2, c2);

    // Case 1: Striped + Striped -> Giant cross (clear 1 row, 1 col)
    if ((c1Special === SPECIAL_STRIPED_H || c1Special === SPECIAL_STRIPED_V) &&
        (c2Special === SPECIAL_STRIPED_H || c2Special === SPECIAL_STRIPED_V)) {
      for (let c = 0; c < this.width; c++) { clearCell(r1, c); }
      for (let r = 0; r < this.height; r++) { clearCell(r, c1); }
    }
    // Case 2: Striped + Wrapped -> Mega Cross (Clear 3 rows, 3 cols)
    else if ((c1Special === SPECIAL_STRIPED_H || c1Special === SPECIAL_STRIPED_V) && c2Special === SPECIAL_WRAPPED ||
             (c2Special === SPECIAL_STRIPED_H || c2Special === SPECIAL_STRIPED_V) && c1Special === SPECIAL_WRAPPED) {
      for (let offset = -1; offset <= 1; offset++) {
        const row = r1 + offset;
        const col = c1 + offset;
        for (let c = 0; c < this.width; c++) { clearCell(row, c); }
        for (let r = 0; r < this.height; r++) { clearCell(r, col); }
      }
    }
    // Case 3: Wrapped + Wrapped -> Huge 5x5 explosion
    else if (c1Special === SPECIAL_WRAPPED && c2Special === SPECIAL_WRAPPED) {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          clearCell(r1 + dr, c1 + dc);
        }
      }
    }

    return { scoreGained, jelliesCleared, destroyedCells };
  }

  // GRAVITY FALLS ENGINE
  applyGravity() {
    const falls = []; // records {id, fromRow, toRow, col}
    const spawns = []; // records {id, colorType, row, col}
    const cols = this.width;
    const rows = this.height;

    // Process from bottom up
    for (let c = 0; c < cols; c++) {
      let emptySlots = 0;
      
      for (let r = rows - 1; r >= 0; r--) {
        // Skip holes
        if (this.layout[r][c] === 0) continue;

        if (this.grid[r][c] === null) {
          emptySlots++;
        } else if (emptySlots > 0) {
          // Slide candy down to the lowest available empty slot
          let lowestEmptyRow = r;
          let count = 0;
          for (let searchR = r + 1; searchR < rows; searchR++) {
            if (this.layout[searchR][c] !== 0 && this.grid[searchR][c] === null) {
              lowestEmptyRow = searchR;
            }
          }

          if (lowestEmptyRow !== r) {
            falls.push({
              id: this.grid[r][c].id,
              fromRow: r,
              toRow: lowestEmptyRow,
              col: c
            });
            this.grid[lowestEmptyRow][c] = this.grid[r][c];
            this.grid[r][c] = null;
          }
        }
      }

      // Generate new candies at top for remaining empty slots
      for (let r = 0; r < rows; r++) {
        if (this.layout[r][c] !== 0 && this.grid[r][c] === null) {
          const color = Math.floor(Math.random() * CANDY_TYPES);
          const newCandy = this.createNewCandy(color);
          this.grid[r][c] = newCandy;
          
          spawns.push({
            id: newCandy.id,
            color: color,
            row: r,
            col: c
          });
        }
      }
    }

    return { falls, spawns };
  }

  // Count remaining jellies
  getRemainingJellies() {
    let count = 0;
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        count += this.jellyGrid[r][c];
      }
    }
    return count;
  }
}

// ==========================================
// 5. GAME MANAGER CLASS (USER INTERACTION)
// ==========================================
class GameManager {
  constructor() {
    this.board = null;
    this.currentLevel = null;
    this.score = 0;
    this.movesLeft = 0;
    this.comboCount = 0;
    this.hapticsEnabled = true;
    
    // Selection state
    this.selectedCell = null; // {row, col}
    
    // Drag & touch helpers
    this.dragStartPos = null; // {x, y}
    this.dragStarted = false;
    
    // Game locks
    this.isProcessing = false;
    
    // Local storage progression keys
    this.userProgress = JSON.parse(localStorage.getItem('candy_delight_progress')) || {
      unlockedLevel: 1,
      highScores: {},
      stars: {}
    };

    // Views
    this.activeScreen = 'splash';
    
    // Particles
    this.effects = new EffectSystem(document.getElementById('effects-canvas'));

    this.bindEvents();
    this.updateMapScreen();
  }

  saveProgress() {
    localStorage.setItem('candy_delight_progress', JSON.stringify(this.userProgress));
  }

  bindEvents() {
    // Navigation binds
    document.getElementById('btn-play-now').addEventListener('click', () => {
      sounds.init();
      this.switchScreen('map-screen');
    });
    
    document.getElementById('btn-splash-how-to').addEventListener('click', () => {
      this.showModal('how-to');
    });
    document.getElementById('btn-how-to-close').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('btn-map-back').addEventListener('click', () => {
      this.switchScreen('splash-screen');
    });

    document.getElementById('btn-game-back').addEventListener('click', () => {
      this.switchScreen('map-screen');
    });

    document.getElementById('btn-game-restart').addEventListener('click', () => {
      this.startLevel(this.currentLevel.id);
    });

    // Intro/Outro Modals
    document.getElementById('btn-intro-close').addEventListener('click', () => {
      this.closeModal();
    });
    document.getElementById('btn-intro-start').addEventListener('click', () => {
      this.closeModal();
      this.launchGameplay();
    });

    document.getElementById('btn-victory-next').addEventListener('click', () => {
      this.closeModal();
      this.startLevel(this.currentLevel.id + 1);
    });
    document.getElementById('btn-victory-retry').addEventListener('click', () => {
      this.closeModal();
      this.startLevel(this.currentLevel.id);
    });
    document.getElementById('btn-victory-map').addEventListener('click', () => {
      this.closeModal();
      this.switchScreen('map-screen');
    });

    document.getElementById('btn-defeat-retry').addEventListener('click', () => {
      this.closeModal();
      this.startLevel(this.currentLevel.id);
    });
    document.getElementById('btn-defeat-map').addEventListener('click', () => {
      this.closeModal();
      this.switchScreen('map-screen');
    });

    // Sound toggle
    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
      const isMuted = sounds.toggleMute();
      document.getElementById('sound-icon-on').style.display = isMuted ? 'none' : 'block';
      document.getElementById('sound-icon-off').style.display = isMuted ? 'block' : 'none';
      this.vibrate(10);
    });

    // Haptics toggle
    document.getElementById('btn-toggle-haptics').addEventListener('click', () => {
      this.hapticsEnabled = !this.hapticsEnabled;
      const val = document.getElementById('haptic-icon-on');
      val.style.opacity = this.hapticsEnabled ? '1' : '0.4';
      this.vibrate(40);
    });

    // Grid board touch/mouse interaction (Delegated listeners)
    const boardEl = document.getElementById('game-board');
    
    // Mouse Drag events
    boardEl.addEventListener('mousedown', (e) => this.handleDragStart(e));
    window.addEventListener('mousemove', (e) => this.handleDragMove(e));
    window.addEventListener('mouseup', () => this.handleDragEnd());

    // Touch Drag events
    boardEl.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: true });
    window.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
    window.addEventListener('touchend', () => this.handleDragEnd());

    // Clean up resize events
    window.addEventListener('resize', () => {
      this.effects.resize();
    });
  }

  vibrate(pattern) {
    if (this.hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    this.activeScreen = screenId;
    
    if (screenId === 'map-screen') {
      this.updateMapScreen();
    }
  }

  showModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('active');
    
    // Hide all modal cards
    document.getElementById('modal-level-intro').style.display = 'none';
    document.getElementById('modal-victory').style.display = 'none';
    document.getElementById('modal-defeat').style.display = 'none';
    document.getElementById('modal-how-to').style.display = 'none';

    // Show selected
    document.getElementById(`modal-${modalId}`).style.display = 'flex';
  }

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  }

  updateMapScreen() {
    const container = document.getElementById('level-path-container');
    container.innerHTML = ''; // Clear

    // Calculate total stars
    let totalStars = 0;
    Object.values(this.userProgress.stars).forEach(s => totalStars += s);
    document.getElementById('map-total-stars').textContent = `⭐ ${totalStars}/30`;

    // Render nodes
    LEVELS.forEach(lvl => {
      const isUnlocked = lvl.id <= this.userProgress.unlockedLevel;
      const isCurrent = lvl.id === this.userProgress.unlockedLevel;
      const starsEarned = this.userProgress.stars[lvl.id] || 0;
      
      const nodeWrapper = document.createElement('div');
      nodeWrapper.className = 'level-node-wrapper';

      const node = document.createElement('div');
      node.className = `level-node ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`;
      node.innerHTML = isUnlocked ? lvl.id : `
        <span class="lock-icon">
          <svg viewBox="0 0 24 24" width="12" height="12"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/></svg>
        </span>
      `;

      // Star overlay
      if (isUnlocked) {
        const starsEl = document.createElement('div');
        starsEl.className = 'node-stars';
        starsEl.innerHTML = `
          <span class="node-star ${starsEarned >= 1 ? 'earned' : ''}">⭐</span>
          <span class="node-star ${starsEarned >= 2 ? 'earned' : ''}">⭐</span>
          <span class="node-star ${starsEarned >= 3 ? 'earned' : ''}">⭐</span>
        `;
        node.appendChild(starsEl);
      }

      node.addEventListener('click', () => {
        if (isUnlocked) {
          this.showLevelIntro(lvl);
        } else {
          sounds.playError();
          this.vibrate(30);
        }
      });

      nodeWrapper.appendChild(node);
      container.appendChild(nodeWrapper);
    });
  }

  showLevelIntro(level) {
    this.currentLevel = level;
    document.getElementById('intro-level-num').textContent = level.id;
    document.getElementById('intro-moves-val').textContent = level.moves;
    document.getElementById('intro-target-score').textContent = level.targetScore.toLocaleString();
    document.getElementById('intro-high-score-val').textContent = (this.userProgress.highScores[level.id] || 0).toLocaleString();

    // Setup Goal Icons
    const goalsContainer = document.getElementById('intro-goals-container');
    goalsContainer.innerHTML = '';

    // Always have Score Goal
    const scoreGoal = document.createElement('div');
    scoreGoal.className = 'intro-stat-box';
    scoreGoal.innerHTML = `<span class="lbl">Reach Score</span><span class="val">⭐ ${level.targetScore}</span>`;
    goalsContainer.appendChild(scoreGoal);

    // If has Jelly objectives
    const jellies = this.countJelliesInLayout(level.boardLayout);
    if (jellies > 0) {
      const jellyGoal = document.createElement('div');
      jellyGoal.className = 'intro-stat-box';
      jellyGoal.innerHTML = `<span class="lbl">Clear Jelly</span><span class="val">🧼 ${jellies}</span>`;
      goalsContainer.appendChild(jellyGoal);
    }

    this.showModal('level-intro');
  }

  countJelliesInLayout(layout) {
    let count = 0;
    layout.forEach(row => {
      row.forEach(val => {
        if (val === 2) count += 1;
        if (val === 3) count += 2;
      });
    });
    return count;
  }

  launchGameplay() {
    this.switchScreen('game-screen');
    
    // Set parameters
    this.score = 0;
    this.movesLeft = this.currentLevel.moves;
    this.isProcessing = false;
    this.selectedCell = null;
    this.comboCount = 0;

    // Build the board
    this.board = new Board(this.currentLevel);
    
    this.renderBoard();
    this.updateStatsUI();
    this.effects.resize();
  }

  startLevel(lvlId) {
    const level = LEVELS.find(l => l.id === lvlId);
    if (level) {
      this.showLevelIntro(level);
    } else {
      // Game completely won! Back to map
      this.switchScreen('map-screen');
    }
  }

  // ==========================================
  // GAME BOARD RENDERING (DOM SYNC)
  // ==========================================
  renderBoard() {
    const boardEl = document.getElementById('game-board');
    boardEl.innerHTML = '';
    
    // Configure columns/rows sizes dynamically
    boardEl.style.gridTemplateColumns = `repeat(${this.board.width}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${this.board.height}, 1fr)`;

    for (let r = 0; r < this.board.height; r++) {
      for (let c = 0; c < this.board.width; c++) {
        const cellType = this.board.layout[r][c];
        
        if (cellType === 0) {
          // Hole
          const cell = document.createElement('div');
          cell.style.opacity = '0';
          boardEl.appendChild(cell);
          continue;
        }

        const cell = document.createElement('div');
        cell.className = `cell ${ (r + c) % 2 === 0 ? '' : 'alternate-tile'}`;
        cell.dataset.row = r;
        cell.dataset.col = c;
        
        // Add Jelly decoration
        const jellyLayer = this.board.jellyGrid[r][c];
        if (jellyLayer === 1) {
          cell.classList.add('jelly');
        } else if (jellyLayer === 2) {
          cell.classList.add('jelly-double');
        }

        // Render candy if it exists
        const candy = this.board.grid[r][c];
        if (candy) {
          const wrapper = this.createCandyDOMElement(candy, r, c);
          cell.appendChild(wrapper);
        }

        boardEl.appendChild(cell);
      }
    }
  }

  createCandyDOMElement(candy, r, c) {
    const wrapper = document.createElement('div');
    wrapper.className = 'candy-wrapper pop-in';
    wrapper.dataset.candyId = candy.id;
    wrapper.dataset.row = r;
    wrapper.dataset.col = c;

    // Use responsive percentages for positioning absolute inside cells
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'candy-svg');
    
    // Set correct symbol
    let href = `#candy-${candy.type}`;
    if (candy.special === SPECIAL_BOMB) {
      href = '#candy-bomb';
    }
    
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
    svg.appendChild(use);
    wrapper.appendChild(svg);

    // Overlays for striped/wrapped candies
    if (candy.special && candy.special !== SPECIAL_BOMB) {
      const overlaySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      overlaySvg.setAttribute('class', 'special-overlay');
      const overlayUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      
      if (candy.special === SPECIAL_STRIPED_H) {
        overlayUse.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#stripe-h');
      } else if (candy.special === SPECIAL_STRIPED_V) {
        overlayUse.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#stripe-v');
      } else if (candy.special === SPECIAL_WRAPPED) {
        overlayUse.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#wrapped-wing');
      }
      overlaySvg.appendChild(overlayUse);
      wrapper.appendChild(overlaySvg);
    }

    return wrapper;
  }

  // ==========================================
  // DRAG / TOUCH INTERACTION LOGIC
  // ==========================================
  handleDragStart(e) {
    if (this.isProcessing) return;
    sounds.init();

    const wrapper = e.target.closest('.candy-wrapper');
    if (!wrapper) return;

    const row = parseInt(wrapper.dataset.row);
    const col = parseInt(wrapper.dataset.col);
    
    this.selectedCell = { row, col };
    
    // Highlight
    wrapper.classList.add('selected');

    // Record drag location
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    this.dragStartPos = { x: clientX, y: clientY };
    this.dragStarted = true;
  }

  handleDragMove(e) {
    if (!this.dragStarted || !this.selectedCell) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - this.dragStartPos.x;
    const dy = clientY - this.dragStartPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Swap if dragged past threshold (25px)
    if (dist > 25) {
      this.dragStarted = false; // block multiple swings
      
      let targetRow = this.selectedCell.row;
      let targetCol = this.selectedCell.col;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swap
        targetCol += dx > 0 ? 1 : -1;
      } else {
        // Vertical swap
        targetRow += dy > 0 ? 1 : -1;
      }

      this.executeSwap(this.selectedCell.row, this.selectedCell.col, targetRow, targetCol);
    }
  }

  handleDragEnd() {
    this.dragStarted = false;
    if (this.selectedCell) {
      const selectedEl = document.querySelector(`.candy-wrapper.selected`);
      if (selectedEl) selectedEl.classList.remove('selected');
      this.selectedCell = null;
    }
  }

  // ==========================================
  // CORE GAME LOOP & RESOLUTION STAGES
  // ==========================================
  async executeSwap(r1, c1, r2, c2) {
    if (this.isProcessing) return;
    
    // Clear selection UI
    const selectedEl = document.querySelector(`.candy-wrapper.selected`);
    if (selectedEl) selectedEl.classList.remove('selected');

    // Validate
    if (!this.board.canSwap(r1, c1, r2, c2)) {
      // Invalid! Play shake animation & error sound
      this.vibrate([40, 40]);
      sounds.playError();
      
      const wrapper1 = document.querySelector(`.candy-wrapper[data-row="${r1}"][data-col="${c1}"]`);
      const wrapper2 = document.querySelector(`.candy-wrapper[data-row="${r2}"][data-col="${c2}"]`);
      if (wrapper1) wrapper1.classList.add('shake');
      if (wrapper2) wrapper2.classList.add('shake');

      setTimeout(() => {
        if (wrapper1) wrapper1.classList.remove('shake');
        if (wrapper2) wrapper2.classList.remove('shake');
      }, 300);
      
      return;
    }

    this.isProcessing = true;
    this.movesLeft--;
    this.comboCount = 0;
    this.updateStatsUI();

    // Trigger visual swap
    sounds.playSwap();
    await this.animateSwapDOM(r1, c1, r2, c2);

    // Swap data
    const candy1 = this.board.grid[r1][c1];
    const candy2 = this.board.grid[r2][c2];
    this.board.swapCandies(r1, c1, r2, c2);

    // Perform specialized combos if applicable
    let resolveRes = null;
    
    if (candy1.special === SPECIAL_BOMB || candy2.special === SPECIAL_BOMB) {
      // Color bomb activation
      if (candy1.special === SPECIAL_BOMB) {
        resolveRes = this.board.activateColorBomb(r1, c1, r2, c2);
      } else {
        resolveRes = this.board.activateColorBomb(r2, c2, r1, c1);
      }
      sounds.playSpecial();
      this.vibrate([80, 50, 100]);
    } else if (candy1.special && candy2.special) {
      // Two specials swapped
      resolveRes = this.board.activateSpecialCombo(r1, c1, r2, c2);
      sounds.playSpecial();
      this.vibrate([100, 60, 150]);
    }

    // Process cascade matching loop
    if (resolveRes) {
      // Add combo scores & explosions
      this.score += resolveRes.scoreGained;
      await this.detonateCandiesDOM(resolveRes.destroyedCells);
      await this.runFallsAndRefillCascade();
    } else {
      // Standard match
      await this.processMatchesStep({ r: r2, c: c2 }); // Pass swap destination to favor special spawn coords
    }
  }

  // Swap Animation
  animateSwapDOM(r1, c1, r2, c2) {
    return new Promise((resolve) => {
      const el1 = document.querySelector(`.candy-wrapper[data-row="${r1}"][data-col="${c1}"]`);
      const el2 = document.querySelector(`.candy-wrapper[data-row="${r2}"][data-col="${c2}"]`);

      if (!el1 || !el2) {
        resolve();
        return;
      }

      // Calculate pixel translation deltas
      const rect1 = el1.getBoundingClientRect();
      const rect2 = el2.getBoundingClientRect();

      const dx = rect2.left - rect1.left;
      const dy = rect2.top - rect1.top;

      el1.style.transform = `translate(${dx}px, ${dy}px)`;
      el2.style.transform = `translate(${-dx}px, ${-dy}px)`;

      // Clean up inline styles afterwards
      setTimeout(() => {
        el1.style.transform = '';
        el2.style.transform = '';
        resolve();
      }, 180);
    });
  }

  // Detonation Animation
  detonateCandiesDOM(cells) {
    return new Promise((resolve) => {
      if (cells.length === 0) {
        resolve();
        return;
      }

      cells.forEach(cell => {
        const el = document.querySelector(`.candy-wrapper[data-row="${cell.r}"][data-col="${cell.c}"]`);
        if (el) {
          el.classList.add('pop-out');
          
          // Generate sparkles
          const rect = el.getBoundingClientRect();
          const boardRect = document.getElementById('game-board').getBoundingClientRect();
          const px = rect.left - boardRect.left + rect.width / 2;
          const py = rect.top - boardRect.top + rect.height / 2;
          
          const candyObj = this.board.grid[cell.r][cell.c];
          const colorIndex = candyObj ? candyObj.type : 0;
          const pColor = CANDY_HEX_COLORS[colorIndex] || '#ffffff';

          if (candyObj && candyObj.special) {
            this.effects.addBlast(px, py, 60, pColor);
          } else {
            this.effects.addSparkles(px, py, pColor, 8);
          }
        }

        // Check if jelly cleared here to update UI visually
        const cellEl = document.querySelector(`.cell[data-row="${cell.r}"][data-col="${cell.c}"]`);
        if (cellEl) {
          // Sync jelly styling dynamically
          const jellyLvl = this.board.jellyGrid[cell.r][cell.c];
          cellEl.className = `cell ${ (cell.r + cell.c) % 2 === 0 ? '' : 'alternate-tile'}`;
          if (jellyLvl === 1) cellEl.classList.add('jelly');
          if (jellyLvl === 2) cellEl.classList.add('jelly-double');
        }
      });

      setTimeout(() => {
        cells.forEach(cell => {
          const el = document.querySelector(`.candy-wrapper[data-row="${cell.r}"][data-col="${cell.c}"]`);
          if (el) el.remove();
        });
        resolve();
      }, 250);
    });
  }

  // Cascade matches step
  async processMatchesStep(swapOrigin = null) {
    this.comboCount++;
    const res = this.board.analyzeAndResolveMatches(swapOrigin);
    
    if (res.destroyedCells.length > 0) {
      this.score += res.scoreGained;
      this.vibrate(20 + this.comboCount * 10);
      sounds.playPop(this.comboCount);
      
      this.updateStatsUI();

      // Render explosion pops
      await this.detonateCandiesDOM(res.destroyedCells);
      
      // Slide candies down, fill board
      await this.runFallsAndRefillCascade();
    } else {
      // Cascade finished! Check game end
      this.isProcessing = false;
      this.checkLevelStatus();
    }
  }

  async runFallsAndRefillCascade() {
    const { falls, spawns } = this.board.applyGravity();
    
    // Animate falling candies
    await this.animateFallsDOM(falls, spawns);
    
    // Sync DOM structures with the current board state completely
    this.renderBoard();
    
    // Recurse for cascade chain check
    setTimeout(() => {
      this.processMatchesStep();
    }, 100);
  }

  animateFallsDOM(falls, spawns) {
    return new Promise((resolve) => {
      // Calculate how many grids deep each candy falls and animate
      falls.forEach(fall => {
        const el = document.querySelector(`.candy-wrapper[data-candy-id="${fall.id}"]`);
        if (el) {
          const cellH = el.parentElement.clientHeight + 4; // size + gap
          const rowsDelta = fall.toRow - fall.fromRow;
          
          el.style.transition = 'none';
          el.style.transform = `translateY(${-rowsDelta * cellH}px)`;
          
          // Force layout flush
          el.offsetHeight; 
          
          el.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
          el.style.transform = 'translateY(0px)';
        }
      });

      // Animate new spawns popped into space
      // Note: renderBoard() handles generating their wrapper.
      // We'll delay resolve briefly to allow falling animations to finish
      setTimeout(() => {
        resolve();
      }, 350);
    });
  }

  // ==========================================
  // SCORE & PROGRESS UI UPDATES
  // ==========================================
  updateStatsUI() {
    document.getElementById('game-moves-left').textContent = this.movesLeft;
    document.getElementById('game-current-score').textContent = this.score.toLocaleString();

    // Goals display
    const goalsList = document.getElementById('game-goals');
    goalsList.innerHTML = '';

    const remainingJellies = this.board ? this.board.getRemainingJellies() : this.countJelliesInLayout(this.currentLevel.boardLayout);
    if (remainingJellies > 0) {
      goalsList.innerHTML = `<span class="goal-item">🧼 <span class="goal-count">${remainingJellies}</span></span>`;
    } else {
      goalsList.innerHTML = `<span class="goal-item">⭐ <span class="goal-count">${this.currentLevel.targetScore.toLocaleString()}</span></span>`;
    }

    // Score Milestones Progress Bar
    const progressPercent = Math.min(100, (this.score / this.currentLevel.starMilestones[2]) * 100);
    const scoreBar = document.getElementById('game-score-bar');
    scoreBar.style.width = `${progressPercent}%`;

    // Highlight milestone stars on progress bar
    this.currentLevel.starMilestones.forEach((scoreReq, index) => {
      const starEl = document.getElementById(`star-m-${index + 1}`);
      const isActive = this.score >= scoreReq;
      
      if (isActive) {
        starEl.classList.add('active');
      } else {
        starEl.classList.remove('active');
      }
      
      // Position them along the bar
      const positionPercent = (scoreReq / this.currentLevel.starMilestones[2]) * 100;
      starEl.style.left = `${positionPercent}%`;
    });
  }

  // ==========================================
  // GAME END CHECKS (VICTORY / DEFEAT)
  // ==========================================
  checkLevelStatus() {
    const remainingJellies = this.board.getRemainingJellies();
    
    // Victory conditions
    const hasClearedJellies = remainingJellies === 0;
    const hasReachedScore = this.score >= this.currentLevel.targetScore;
    
    const isVictorious = hasClearedJellies && hasReachedScore;

    if (isVictorious) {
      this.handleVictory();
    } else if (this.movesLeft <= 0) {
      this.handleDefeat(remainingJellies);
    }
  }

  handleVictory() {
    sounds.playVictory();
    this.vibrate([100, 50, 100, 50, 200]);

    // Calculate stars won
    let starsWon = 1;
    if (this.score >= this.currentLevel.starMilestones[2]) starsWon = 3;
    else if (this.score >= this.currentLevel.starMilestones[1]) starsWon = 2;

    // Save level state
    const currentHighScore = this.userProgress.highScores[this.currentLevel.id] || 0;
    if (this.score > currentHighScore) {
      this.userProgress.highScores[this.currentLevel.id] = this.score;
    }

    const currentStars = this.userProgress.stars[this.currentLevel.id] || 0;
    if (starsWon > currentStars) {
      this.userProgress.stars[this.currentLevel.id] = starsWon;
    }

    // Unlock next level
    if (this.currentLevel.id === this.userProgress.unlockedLevel && this.currentLevel.id < LEVELS.length) {
      this.userProgress.unlockedLevel = this.currentLevel.id + 1;
    }

    this.saveProgress();

    // Populate Victory Dialog elements
    document.getElementById('victory-score-val').textContent = this.score.toLocaleString();
    document.getElementById('victory-high-score-val').textContent = this.userProgress.highScores[this.currentLevel.id].toLocaleString();

    // Setup stars visuals
    document.getElementById('victory-star-1').className = `modal-star ${starsWon >= 1 ? 'earned' : 'locked'}`;
    document.getElementById('victory-star-2').className = `modal-star ${starsWon >= 2 ? 'earned' : 'locked'}`;
    document.getElementById('victory-star-3').className = `modal-star ${starsWon >= 3 ? 'earned' : 'locked'}`;

    // Hide or show Next Level Button if last level
    const nextBtn = document.getElementById('btn-victory-next');
    if (this.currentLevel.id === LEVELS.length) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'block';
    }

    setTimeout(() => {
      this.showModal('victory');
    }, 400);
  }

  handleDefeat(remainingJellies) {
    sounds.playDefeat();
    this.vibrate([200, 100, 200]);

    document.getElementById('defeat-score-val').textContent = this.score.toLocaleString();
    document.getElementById('defeat-target-val').textContent = this.currentLevel.targetScore.toLocaleString();

    const defeatGoalsContainer = document.getElementById('defeat-goals-container');
    defeatGoalsContainer.innerHTML = '';

    if (this.score < this.currentLevel.targetScore) {
      const box = document.createElement('div');
      box.className = 'v-stat';
      box.innerHTML = `<span class="lbl">Score Deficit</span><span class="val">⭐ ${(this.currentLevel.targetScore - this.score).toLocaleString()}</span>`;
      defeatGoalsContainer.appendChild(box);
    }
    if (remainingJellies > 0) {
      const box = document.createElement('div');
      box.className = 'v-stat';
      box.innerHTML = `<span class="lbl">Jellies Left</span><span class="val">🧼 ${remainingJellies}</span>`;
      defeatGoalsContainer.appendChild(box);
    }

    setTimeout(() => {
      this.showModal('defeat');
    }, 400);
  }
}

// Initialise Game on load
let gameManager;
window.addEventListener('DOMContentLoaded', () => {
  gameManager = new GameManager();
});
