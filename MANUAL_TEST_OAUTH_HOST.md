# Manual Test Guide: OAuth Host Button Fix

## Test Purpose
Verify that OAuth users who create rooms can see and use the "Start Game" button (not just "Ready" button).

## Bug Description
**Before fix:** OAuth users who created rooms could only see the "Ready" button because their `playerId` was mismatched between client (deviceId) and server (userId).

**After fix:** Room page now uses `session?.user?.id || deviceId` for playerId, matching the server logic.

## Test Steps

### Scenario 1: Guest User (Control - should always work)

1. Open browser in **Incognito/Private mode**
2. Navigate to `http://localhost:3000` (or your deployment URL)
3. Click "Multiplayer" on homepage
4. Wait for socket connection (should see "✅ Socket connected" in browser console)
5. Click "Create Room"
6. Fill in room name: `Guest Test Room`
7. Click "Create Room" (submit button)
8. **EXPECTED**: You should see the "Start Game" button (may be disabled if no other players, but it should be visible)
9. **EXPECTED**: The "Ready" button should be disabled for the host

✅ **PASS**: Guest user can see "Start Game" button
❌ **FAIL**: Guest user can only see "Ready" button

### Scenario 2: OAuth User (The Fix We're Testing)

1. Open a **new regular browser window** (not incognito)
2. Navigate to `http://localhost:3000`
3. Click "Sign In" (top right)
4. Sign in with Google OAuth (or other OAuth provider)
5. After successful sign-in, click "Multiplayer" on homepage
6. Wait for socket connection

   **Check browser console for these logs:**
   ```
   🔍 Session info: {hasSession: true, userId: '...', userName: '...', ...}
   🔌 [SOCKET CLIENT] Connecting with auth: {userId: '...', displayName: '...', ...}
   ```

7. Click "Create Room"
8. Fill in room name: `OAuth Test Room`
9. Click "Create Room" (submit button)

   **Check browser console for these logs:**
   ```
   🔍 [ROOM PAGE] Player identity: {userId: '...', deviceId: '...', actualPlayerId: '...', ...}
   🔍 [ROOM PAGE] isHost check: {playerId: '...', players: [...], isHost: true}
   ```

10. **CRITICAL TEST**: Check which buttons are visible

    **EXPECTED (FIX WORKING):**
    - ✅ You should see "Start Game" button (may be disabled, but VISIBLE)
    - ✅ You should see "Ready" button (should be DISABLED for host)

    **FAILURE (BUG STILL EXISTS):**
    - ❌ You only see "Ready" button
    - ❌ No "Start Game" button visible

11. **Bonus Test**: Have another user (in incognito) join your room
    - Open incognito window
    - Go to multiplayer lobby
    - Find "OAuth Test Room" in the room list
    - Click "Join"
    - Go back to OAuth host window
    - **EXPECTED**: "Start Game" button should now be enabled (if guest is ready)

## Expected Console Logs

### OAuth User Creating Room:

```javascript
// In multiplayer lobby page:
🔍 Session info: {
  hasSession: true,
  userId: '507f1f77bcf86cd799439011',  // MongoDB ObjectId
  userName: 'Your Name',
  deviceId: 'abc123...'
}

// Socket connection:
🔌 [SOCKET CLIENT] Connecting with auth: {
  userId: '507f1f77bcf86cd799439011',
  deviceId: 'abc123...',
  displayName: 'Your Name'
}

// In room page after joining:
🔍 [ROOM PAGE] Player identity: {
  userId: '507f1f77bcf86cd799439011',
  deviceId: 'abc123...',
  actualPlayerId: '507f1f77bcf86cd799439011',  // Should be userId, not deviceId!
  displayName: 'Your Name'
}

🔍 [ROOM PAGE] isHost check: {
  playerId: '507f1f77bcf86cd799439011',
  players: [
    {playerId: '507f1f77bcf86cd799439011', isHost: true}
  ],
  foundPlayer: {playerId: '507f1f77bcf86cd799439011', isHost: true, ...},
  isHost: true  // THIS IS THE KEY - should be true!
}
```

## Success Criteria

✅ **Test PASSES if:**
1. Guest users can see "Start Game" button
2. OAuth users can see "Start Game" button
3. Console shows `isHost: true` for OAuth room creators
4. Console shows `actualPlayerId` equals `userId` (not deviceId) for OAuth users

❌ **Test FAILS if:**
1. OAuth users only see "Ready" button
2. Console shows `isHost: false` for OAuth room creators
3. Console shows `actualPlayerId` equals `deviceId` (not userId) for OAuth users

## Troubleshooting

**If OAuth user doesn't see "Start Game" button:**

1. Check browser console for the `🔍 [ROOM PAGE] isHost check` log
2. Verify that `playerId` matches the `userId` from the session
3. Verify that `foundPlayer.isHost` is `true`
4. If `actualPlayerId` is using `deviceId` instead of `userId`, the fix didn't apply

**If you don't see the debug logs:**

1. Make sure you hard-refreshed the browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Check that the dev server is running the latest code
3. Try clearing browser cache

## Code Changes Summary

This test verifies the changes made to `/app/multiplayer/room/[roomId]/page.tsx`:

1. Added `useSession` hook to get OAuth user info
2. Changed playerId logic from `deviceId` only to `session?.user?.id || deviceId`
3. Added same logic to socket initialization
4. Updated useEffect dependency to re-run when `session?.user?.id` changes
5. Added debug logging to track playerId values
