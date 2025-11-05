# Production Deployment Guide

## Quick Deploy Commands

When you've pushed new code to the repository and need to deploy to production:

```bash
# 1. Stop all containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# 2. Clean up old images and build cache
docker system prune -f

# 3. Rebuild with no cache (ensures latest code is used)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# 4. Start containers in detached mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. Check logs to verify everything started correctly
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100
```

## After Deployment

1. **Clear browser cache** - The browser may cache old JavaScript files
   - **Chrome/Edge**: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - **Or use Incognito/Private mode** for testing

2. **Verify the fix** - Check browser console for these logs:
   ```
   🔍 Session info: {hasSession: true, userId: '...', userName: '...', ...}
   🔌 [SOCKET CLIENT] Connecting with auth: {userId: '...', displayName: '...', ...}
   ```

3. **Test room creation** - Try creating a room while logged in with OAuth

## Troubleshooting

If you still see old behavior:
- Check server logs: `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs app -f`
- Verify image was rebuilt: `docker images | grep typingtoy`
- Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## OAuth Authentication Flow (Current Fix)

The latest code fixes OAuth login by:
1. Getting userId from NextAuth session in `app/multiplayer/page.tsx`
2. Using `token.sub` as fallback in `lib/auth.ts` JWT callback
3. Passing userId to Socket.IO client initialization
4. Server validates userId in production before allowing room creation

## Expected Server Logs After Fix

```
✅ Player connected: Holy Wen (6908710141f75b573674718f)
🔒 Room creation auth check: isProduction=true, userId=6908710141f75b573674718f, NODE_ENV=production
✅ Room created: ...
```
