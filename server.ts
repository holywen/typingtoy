// Custom Next.js server with Socket.IO support
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './lib/services/socketServer';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let serverInstance: any = null;
let isShuttingDown = false;

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  serverInstance = server;

  // Initialize Socket.IO
  const io = initSocketServer(server);
  console.log('✅ Socket.IO server initialized');

  // Clean up stale rooms on startup
  (async () => {
    try {
      const { RoomManager } = await import('./lib/services/roomManager');
      const cleaned = await RoomManager.cleanupStaleRooms();
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} stale rooms on startup`);
      }
    } catch (error) {
      console.error('Error cleaning up stale rooms:', error);
    }
  })();

  // Schedule periodic cleanup every 5 minutes
  setInterval(async () => {
    try {
      const { RoomManager } = await import('./lib/services/roomManager');
      const cleaned = await RoomManager.cleanupStaleRooms();
      if (cleaned > 0) {
        console.log(`🧹 Periodic cleanup: removed ${cleaned} stale rooms`);
      }
    } catch (error) {
      console.error('Error in periodic room cleanup:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  server
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`${signal} signal received: closing HTTP server`);
  
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    
    // Force exit after 5 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 5000);
  } else {
    process.exit(0);
  }
};

// Register signal handlers only once
if (!process.listenerCount('SIGTERM')) {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

if (!process.listenerCount('SIGINT')) {
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}