# Disconnect Cleanup Fix

## Date: 2025-11-04

## Issue
Players remained associated with rooms and matchmaking queues after disconnecting, causing "Already in a room" errors and blocking Quick Match testing.

## Root Cause
The disconnect handler in `lib/services/socketServer.ts` only removed players from Redis online player tracking but did NOT:
1. Call `RoomManager.leaveRoom()` to properly clean up room associations
2. Remove players from matchmaking queues

## Fix Applied

### 1. Enhanced Disconnect Handler (`lib/services/socketServer.ts`)
Added comprehensive cleanup logic to the disconnect event handler:

```typescript
socket.on('disconnect', async (reason) => {
  console.log(`❌ Player disconnected: ${displayName} (${reason})`);

  try {
    // Remove from online players (existing code)
    await redis.srem('online:players', playerId);
    await redis.del(`player:${playerId}:socketId`);

    // NEW: Leave current room if in one
    if (socket.data.currentRoomId) {
      const roomId = socket.data.currentRoomId;
      console.log(`🚪 Player ${displayName} leaving room ${roomId} due to disconnect`);
      
      const { RoomManager } = await import('./roomManager');
      const room = await RoomManager.leaveRoom(roomId, playerId);

      socket.leave(roomId);

      if (room) {
        // Notify remaining players
        io.to(roomId).emit('room:updated', { room });
        io.to(roomId).emit('player:left', { roomId, playerId });
      } else {
        // Room was deleted
        io.emit('room:deleted', { roomId });
      }

      socket.data.currentRoomId = undefined;
    }

    // NEW: Remove from matchmaking queue if in one
    if (socket.data.inMatchmaking) {
      console.log(`🎯 Removing ${displayName} from matchmaking queue`);
      const { MatchmakingService } = await import('./matchmaking');
      await MatchmakingService.removeFromQueue(playerId);
      socket.data.inMatchmaking = false;
      socket.data.matchmakingGameType = undefined;
    }
  } catch (error) {
    console.error(`Error during disconnect cleanup for ${displayName}:`, error);
  }

  socket.emit('player:disconnected', { playerId });
});
```

**Key Changes:**
- Added room leave logic with proper cleanup and notifications
- Added matchmaking queue removal
- Added error handling to prevent disconnect cleanup from crashing
- Added detailed logging for debugging

### 2. Test Cleanup API Endpoint (`app/api/test/cleanup/route.ts`)
Created a new POST endpoint for clearing test data between test runs:

**Features:**
- Deletes all Redis keys related to rooms, players, and matchmaking
- Deletes all rooms from MongoDB
- Only available in development mode (returns 403 in production)
- Returns detailed cleanup statistics

**Usage:**
```typescript
POST /api/test/cleanup
```

**Response:**
```json
{
  "success": true,
  "message": "Test data cleaned up successfully",
  "details": {
    "redisKeysDeleted": 15,
    "roomsDeleted": 3
  }
}
```

### 3. Updated Playwright Tests
Modified both test files to call the cleanup endpoint before running tests:

**Files Updated:**
- `playwright-tests/test-quick-match.ts`
- `playwright-tests/test-room-creation.ts`

**Change:**
```typescript
// Before: Navigate to home page to clear state
await page1.goto('http://localhost:3000');
await page1.waitForTimeout(1000);

// After: Call cleanup API
const cleanupResponse = await page1.request.post('http://localhost:3000/api/test/cleanup');
const cleanupData = await cleanupResponse.json();
console.log('✅ Cleanup completed:', cleanupData.details);
```

## Expected Outcomes

### Disconnect Scenarios
1. **Player disconnects from lobby** → Removed from online players list ✅
2. **Player disconnects from room** → Removed from room, other players notified, room deleted if empty ✅
3. **Player disconnects while in matchmaking queue** → Removed from queue ✅
4. **Host disconnects from room** → Host transferred to another player OR room deleted if alone ✅

### Test Scenarios
1. **Room creation test** → Clean database before each run ✅
2. **Quick match test** → Clean database and queues before each run ✅
3. **Multiple test runs** → No "Already in a room" errors ✅

## Testing Instructions

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Run room creation test:
   ```bash
   npx tsx playwright-tests/test-room-creation.ts
   ```

3. Run quick match test:
   ```bash
   npx tsx playwright-tests/test-quick-match.ts
   ```

4. Verify cleanup by checking server logs for:
   - `🧹 Test cleanup completed`
   - `🚪 Player X leaving room Y due to disconnect`
   - `🎯 Removing X from matchmaking queue`

## Files Modified
1. `lib/services/socketServer.ts` - Enhanced disconnect handler
2. `app/api/test/cleanup/route.ts` - New cleanup endpoint
3. `playwright-tests/test-quick-match.ts` - Added cleanup call
4. `playwright-tests/test-room-creation.ts` - Added cleanup call

## Related Memories
- `multiplayer-phase2-test-results` - Test results that identified this issue
- `multiplayer-phase2-completed-features` - Features now ready for testing
