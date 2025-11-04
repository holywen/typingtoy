# Game Architecture Analysis - Typing Toy

## Overview
The typing toy application has 4 games, all currently single-player. No multiplayer, networking, or WebSocket implementations exist yet.

## The Four Games

### 1. FALLING BLOCKS (🧱)
**Location:** `/app/games/falling-blocks/page.tsx`
**Mechanics:**
- Individual blocks with single characters fall from top to bottom
- Player types the character to destroy the block before it reaches bottom
- Block spawns periodically (2000ms - 100ms * level)
- Each block has: id, char, x (10-90% of width), y (0-90%), speed (0.5 + level * 0.1)
- Game Over triggers when any block reaches y >= 90%

**Scoring & Progression:**
- Score: +10 per correct keystroke
- Level up: Every 100 points earned
- Speed increases with level (spawn frequency & block speed)
- No streak tracking
- No lives/health system

**Data Structure:**
```typescript
interface FallingBlock {
  id: number;
  char: string;
  x: number;
  y: number;
  speed: number;
}
```

**Input Handling:** Direct keystroke comparison against falling block characters

---

### 2. BLINK (⚡)
**Location:** `/app/games/blink/page.tsx`
**Mechanics:**
- Single character displayed, player must type it before timer expires
- Timer starts at 2000ms, decreases by 100ms per level
- Character blinks in/out (display/hide effect)
- Game Over when timer expires (timeLeft <= 0)

**Scoring & Progression:**
- Score: +10 base + streak bonus per correct keystroke
- Wrong key: -5 points
- Streak: Resets on wrong keystroke, increases on correct
- Level up: Every 100 points earned
- Time decreases: Max(1000ms, 2000ms - 100ms * level)

**Data Structure:**
```typescript
- currentChar: string
- displayChar: boolean
- timeLeft: number (milliseconds)
- streak: number
- bestStreak: number
```

**Input Handling:** Direct keystroke comparison against displayed character

---

### 3. TYPING WALK (🚶)
**Location:** `/app/games/typing-walk/page.tsx`
**Mechanics:**
- 10x22 grid with a generated winding path from left to right
- Player character starts at left (column 1), must reach right (column 21)
- Each cell contains a random character from selected lesson
- Player must type the character at the next grid position to advance
- Path is pre-calculated and highlighted (next target highlighted in yellow)

**Scoring & Progression:**
- Score: +10 per correct keystroke
- Lives: Start with 5, lose 1 for wrong keystroke
- Game Over: 0 lives OR wrong keystroke at next position
- Win condition: playerCol === GRID_COLS - 1 (reached right edge)
- Time tracking: Continuous timer for performance

**Data Structure:**
```typescript
const GRID_ROWS = 10;
const GRID_COLS = 22;

interface GridCell {
  char: string;
  isPath: boolean;
  isVisited: boolean;
  isHighlight: boolean;
}

- currentPath: Array<{row, col}> (winding path)
- playerRow, playerCol (current position)
- grid: GridCell[][]
```

**Input Handling:** Keystroke must match the character at the next position in the path

---

### 4. FALLING WORDS (📝)
**Location:** `/app/games/falling-words/page.tsx`
**Mechanics:**
- Complete words fall from top to bottom
- Player types letters progressively; word disappears when fully typed
- Words spawn periodically (3000ms - 150ms * level)
- Word is removed if it reaches y >= 85%

**Scoring & Progression:**
- Score: +(wordLength * 5) points per completed word
- Level up: Every 100 points earned
- Tracking: Progress shown as green (typed) + gray (remaining)
- Word generation: Uses lesson focus keys to generate 2-4 letter combinations

**Data Structure:**
```typescript
interface FallingWord {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  typed: string; // Characters typed so far
}
```

**Input Handling:** First keystroke matching any word's next expected character advances that word

---

## Common Features Across All Games

### Lesson Selection
- All games support lesson selection (1-15) or "All Keys" mode
- Lesson data provides `focusKeys` array
- Characters drawn from selected lesson's focus keys

### Game Flow
1. Pre-game screen: Lesson selection + Start button
2. Game active: Real-time gameplay
3. Game Over screen: Score display + Play Again / Back to Games buttons
4. Enter key support: Restart game from game over screen

### State Management (React Hooks Only)
- `useState` for game state (score, level, lives, etc.)
- `useCallback` for event handlers
- `useRef` for interval/timer handles
- Direct keyboard event listeners via `window.addEventListener`

### UI Patterns
- Dark mode support (Tailwind `dark:` prefixes)
- HUD display (top of screen with score/level/lives)
- Game over modal overlay (black/70 opacity)
- Gradient backgrounds (game-specific colors)

### Keyboard Input
- All games use `handleKeyPress` callback
- Direct keystroke validation (no composition support)
- Event propagation: Escape/special keys ignored
- Enter key: Restarts game from game over state

---

## State Management Architecture

### Current (React Hooks)
- No Zustand usage (despite being in package.json)
- No Context API for game state
- Each game is isolated - no shared game state
- Game state only persists as localStorage history (via progressStorage service)

### Data Persistence
**Games do NOT currently save:**
- Game sessions to progress history
- Individual keystroke data
- Game-specific metrics (streak, lives used, etc.)

**What CAN be saved (progressStorage service):**
```typescript
interface ProgressRecord {
  id: string;
  lessonId?: string;
  sessionType: 'lesson' | 'speed_test' | 'custom' | 'game'
  metrics: TypingMetrics (WPM, accuracy, duration, etc.)
  completedAt: string
}
```

---

## Real-Time Features

### Game Loops
- **Falling Blocks & Words:** `setInterval(gameLoop, 50)` - 50ms tick rate
- **Blink:** Direct timer via `setInterval(..., 10)` - 10ms tick rate  
- **Typing Walk:** Timer only, no animation loop

### Performance Optimizations
- Falling block position updates in state batches (not per-keystroke)
- No animations - CSS transforms + DOM position
- Game loop intervals properly cleaned up on unmount

---

## Missing Networking/Multiplayer Infrastructure

### No WebSocket Support
- No socket.io, ws, or any real-time library
- No server-side game logic

### No API Endpoints for Games
- `/api/user/sync` - Only for progress sync
- `/api/generate-text` - Text generation only
- No game session endpoints

### No Multiplayer State
- No user vs user comparison
- No leaderboards
- No concurrent game tracking
- No real-time score updates between players

---

## TypeScript Types Available

### Game-related in types/index.ts
```typescript
export interface TypingMetrics {
  grossWPM: number;
  netWPM: number;
  accuracy: number;
  duration: number;
  charactersTyped: number;
  errors: number;
  correctedErrors: number;
}

export interface UserProgress {
  id: string;
  userId: string;
  lessonId?: string;
  sessionType: 'lesson' | 'speed_test' | 'custom' | 'game';
  metrics: TypingMetrics;
  keystrokeData?: Keystroke[];
  completedAt: Date;
}
```

---

## Infrastructure Available for Multiplayer

### Installed Dependencies
- **Redis:** redis@^4.7.0 (NOT USED - available for caching/pubsub)
- **MongoDB:** mongodb@^6.12.0 + mongoose@^8.9.1 (Connection ready but games don't use)
- **NextAuth.js:** next-auth@^5.0.0-beta.30 (Configured but not implemented)
- **Zustand:** zustand@^5.0.2 (Installed but not used)

### Environment Setup
```
MONGODB_URI=mongodb://localhost:27017/typingtoy
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=mE+l+8ozo7NWaPq9ls3Cev+P4/5sy6LrdsoMOaaMoVc=
NEXTAUTH_URL=http://localhost:3001
```

---

## Summary for Multiplayer Implementation

### Current State
- All 4 games are **100% client-side**, single-player only
- No game session concept server-side
- No real-time communication infrastructure
- State is ephemeral (lost on refresh)
- Progress tracking separate from games (via localStorage)

### Key Challenges to Address
1. **Game Synchronization:** Currently games update state independently with no server coordination
2. **Real-time Updates:** No WebSocket or Server-Sent Events
3. **Score Fairness:** No server-side validation (client can cheat)
4. **Concurrent Players:** No mechanism to track multiple players in same game
5. **Latency Compensation:** Keystroke timing will vary by network latency

### Opportunities
- Clean foundation: No legacy multiplayer code to refactor
- Infrastructure ready: MongoDB, Redis, NextAuth all configured
- Good typing mechanics: Well-designed single-player games to build upon
- Type safety: TypeScript throughout with good types defined
