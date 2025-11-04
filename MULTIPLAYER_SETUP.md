# Multiplayer Features Setup Guide

This guide will help you set up and test the multiplayer features for TypingToy.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (v5 or higher)
3. **Redis** (v6 or higher)

## Installation

### 1. Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### 2. Install Redis

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows:**
Download from [Redis Downloads](https://redis.io/download) or use WSL

### 3. Install Project Dependencies

```bash
npm install
```

## Configuration

### 1. Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/typingtoy

# Redis (Required for multiplayer)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Server Configuration
PORT=3000
HOSTNAME=localhost
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth (generate with: openssl rand -base64 32)
AUTH_SECRET=your-generated-secret-here
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Node Environment
NODE_ENV=development
```

### 2. Verify Services

**Check MongoDB:**
```bash
mongosh
# Should connect successfully
# Type 'exit' to quit
```

**Check Redis:**
```bash
redis-cli ping
# Should return: PONG
```

## Running the Application

### Development Mode

Start the development server with Socket.IO support:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Mode

Build and start the production server:
```bash
npm run build
npm start
```

## Testing Multiplayer Features

### 1. Test Room System

1. Open `http://localhost:3000/multiplayer` in your browser
2. You should see the multiplayer lobby with:
   - Game type selector (Falling Blocks, Blink, Typing Walk, Falling Words)
   - Create Room button
   - Quick Match button
   - Available rooms list
   - Online players list
   - Lobby chat

### 2. Create a Room

1. Click "Create Room"
2. Fill in room details:
   - Room name (default: "YourName's Room")
   - Max players (2-8)
   - Private room toggle (optional)
   - Password (if private)
3. Click "Create Room"
4. You'll be redirected to the room page

### 3. Test Multi-Client

To test multiplayer functionality:

1. **Option A: Multiple Browser Windows**
   - Open multiple browser windows/tabs
   - Navigate to `http://localhost:3000/multiplayer` in each
   - Each will have a different device ID (guest player)

2. **Option B: Multiple Browsers**
   - Use Chrome, Firefox, Safari, etc.
   - Navigate to `http://localhost:3000/multiplayer` in each

3. **Option C: Incognito/Private Windows**
   - Open incognito/private windows for separate sessions

### 4. Test Room Features

With multiple clients:

1. **Create and Join:**
   - Client 1: Create a room
   - Client 2: See the room in the list and click "Join"

2. **Chat:**
   - Both clients should see messages in real-time
   - Test rate limiting (max 2 messages per second)

3. **Ready System:**
   - Non-host players: Toggle "Ready" status
   - Host: "Start Game" button enables when all players are ready

4. **Kick Player (Host only):**
   - Host can kick other players from the room
   - Kicked player is redirected to lobby

5. **Leave Room:**
   - Any player can leave
   - Host leaving transfers host to another player
   - Last player leaving deletes the room

### 5. Test Quick Match

1. Click "Quick Match" button
2. System will search for opponents
3. If multiple players queue within ~5 seconds, a match is created
4. All matched players are automatically placed in a room

### 6. Test Matchmaking Timeout

1. Click "Quick Match" alone
2. Wait for 60 seconds
3. You should receive a timeout notification
4. Return to lobby

## Architecture Overview

### Components Created

**Frontend:**
- `/app/multiplayer/page.tsx` - Multiplayer entry point
- `/app/multiplayer/room/[roomId]/page.tsx` - Room page
- `/components/lobby/GameLobby.tsx` - Main lobby UI
- `/components/lobby/RoomList.tsx` - Available rooms display
- `/components/lobby/CreateRoomDialog.tsx` - Room creation modal
- `/components/lobby/QuickMatchButton.tsx` - Matchmaking UI
- `/components/lobby/ChatBox.tsx` - Real-time chat
- `/components/lobby/OnlinePlayerList.tsx` - Online players

**Backend:**
- `server.ts` - Custom Next.js server with Socket.IO
- `/lib/services/socketServer.ts` - Socket.IO server setup
- `/lib/services/socketClient.ts` - Socket.IO client setup
- `/lib/services/roomManager.ts` - Room CRUD operations
- `/lib/services/matchmaking.ts` - Auto-matching algorithm
- `/lib/services/skillRating.ts` - ELO-style rating system
- `/lib/services/deviceId.ts` - Device fingerprinting

**Socket Handlers:**
- `/lib/services/socketHandlers/roomHandlers.ts` - Room events
- `/lib/services/socketHandlers/matchHandlers.ts` - Matchmaking events
- `/lib/services/socketHandlers/chatHandlers.ts` - Chat events
- `/lib/services/socketHandlers/gameHandlers.ts` - Game events (Phase 3)
- `/lib/services/socketHandlers/spectatorHandlers.ts` - Spectator events (Phase 4)

**Data Models:**
- `/lib/db/models/GameRoom.ts` - Room data model
- `/lib/db/models/GameSession.ts` - Game session records
- `/lib/db/models/Leaderboard.ts` - Multi-period leaderboards
- `/lib/db/models/User.ts` - Extended with multiplayer fields

**Redis Services:**
- `/lib/redis/client.ts` - Redis connection manager
- `/lib/redis/roomCache.ts` - Room caching (24h TTL)
- `/lib/redis/matchQueue.ts` - Matchmaking queue (5min TTL)
- `/lib/redis/chatCache.ts` - Chat history (50 messages)

### Key Features

1. **Device Fingerprinting**
   - Guest players use FingerprintJS for identification
   - Auto-generated display names (e.g., "SwiftTyper1234")
   - Persistent across browser sessions via localStorage

2. **Room System**
   - Public and private (password-protected) rooms
   - 2-8 players per room
   - Host controls (start game, kick players)
   - Ready system for all non-host players
   - Auto-host transfer when host leaves

3. **Matchmaking**
   - Skill-based matching (4 tiers: Beginner/Intermediate/Advanced/Expert)
   - Same-tier matching preferred
   - Cross-tier matching after 30s wait
   - 60s timeout for unmatched players
   - Automatic room creation with 2-4 matched players

4. **Real-time Chat**
   - Room chat and lobby chat
   - Rate limiting (2 messages/second per player)
   - Message history (last 50 messages)
   - Mute functionality for moderation

5. **Skill Rating System**
   - Rating = (avgWPM × 0.7) + (avgAccuracy × 0.3)
   - Based on last 10 game sessions
   - ELO-style rating adjustments after games
   - Separate ratings per game type

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh
# or
mongo
```

If connection fails:
```bash
# Start MongoDB service
# macOS:
brew services start mongodb-community
# Linux:
sudo systemctl start mongod
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping
```

If connection fails:
```bash
# Start Redis service
# macOS:
brew services start redis
# Linux:
sudo systemctl start redis-server
```

### Socket.IO Connection Issues

1. Check that the server is running: `npm run dev`
2. Check browser console for WebSocket errors
3. Verify `NEXT_PUBLIC_APP_URL` matches your server URL
4. Check firewall settings

### TypeScript Compilation Errors

```bash
# Clean build
rm -rf .next
npm run build
```

## Next Steps (Pending Implementation)

- **Phase 3:** Real-time game synchronization
  - Keystroke broadcasting
  - Live progress updates
  - Client-side prediction
  - Server-side validation

- **Phase 4:** Spectator mode
  - Watch ongoing games
  - Multi-view support
  - Spectator chat

- **Phase 5:** Leaderboard system
  - Global all-time rankings
  - Daily/Weekly/Monthly rankings
  - Friend leaderboards
  - Per-game-type leaderboards

- **Phase 6:** UI integration and optimization
  - Integrate with existing game components
  - Performance optimizations
  - Mobile responsiveness

- **Phase 7:** Internationalization and testing
  - i18n support for all multiplayer UI
  - Comprehensive test suite
  - Load testing

## Development Notes

### Adding New Game Events

1. Define event types in `/types/socket.ts`
2. Implement handler in `/lib/services/socketHandlers/gameHandlers.ts`
3. Add client-side listener in game component
4. Test with multiple clients

### Monitoring Redis

```bash
# Connect to Redis CLI
redis-cli

# View all keys
KEYS *

# View room data
GET room:ROOM_ID_HERE

# View match queue
ZRANGE match:queue:GAME_TYPE 0 -1 WITHSCORES

# View chat history
LRANGE chat:room:ROOM_ID_HERE 0 -1
```

### Monitoring MongoDB

```bash
# Connect to MongoDB
mongosh

# Switch to typingtoy database
use typingtoy

# View rooms
db.gamerooms.find().pretty()

# View sessions
db.gamesessions.find().limit(10).pretty()

# View leaderboards
db.leaderboards.find().pretty()
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the implementation plan: `MULTIPLAYER_IMPLEMENTATION_PLAN.md`
3. Check the codebase architecture: `CLAUDE.md`
