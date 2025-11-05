// Redis client configuration

import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    // Support both REDIS_URL (standard) and individual REDIS_HOST/PORT variables
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      // Use REDIS_URL if provided (e.g., redis://redis:6379)
      redisClient = new Redis(redisUrl, {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });
    } else {
      // Fall back to individual environment variables
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });
    }

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });

    redisClient.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Singleton instance
export const redis = getRedisClient();
