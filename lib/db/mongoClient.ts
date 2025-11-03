import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/typingstudy';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 */
type MongoClientCache = {
  conn: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoClient: MongoClientCache | undefined;
}

let cached: MongoClientCache = global.mongoClient || { conn: null, promise: null };

if (!global.mongoClient) {
  global.mongoClient = cached;
}

async function getMongoClient() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const client = new MongoClient(MONGODB_URI);
    cached.promise = client.connect().then((client) => {
      console.log('✅ MongoDB Client connected successfully');
      return client;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

const clientPromise = getMongoClient();

export default clientPromise;
