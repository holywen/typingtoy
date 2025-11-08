import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/typingstudy';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 */
/**
 * MongoDB Client connection for NextAuth
 * Following Next.js recommended pattern for global caching
 * https://github.com/vercel/next.js/blob/canary/examples/with-mongodb/lib/mongodb.ts
 */

type CachedConnection = {
  conn: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientCache: CachedConnection | undefined;
}

let cached = global._mongoClientCache;

if (!cached) {
  cached = global._mongoClientCache = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<MongoClient> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {};
    cached!.promise = new MongoClient(MONGODB_URI, opts).connect();
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

// Export the connection promise for NextAuth MongoDBAdapter
const clientPromise = connectToDatabase();

export default clientPromise;
