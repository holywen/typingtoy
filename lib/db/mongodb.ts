import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/typingstudy';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 * This prevents connections growing exponentially during API Route usage.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Initialize global cache if not exists
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Always use the global cached reference to survive hot reloads
  const cached = global.mongoose!;

  if (cached.conn) {
    // Return cached connection without logging
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Only log when actually creating a NEW connection
    console.log('🔄 Creating new Mongoose connection...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('✅ MongoDB connected successfully');
      cached.conn = m;
      return m;
    }).catch((e) => {
      // Clear the promise on error so we can retry
      cached.promise = null;
      cached.conn = null;
      console.error('❌ MongoDB connection failed:', e);
      throw e;
    });
  }

  try {
    const conn = await cached.promise;
    return conn;
  } catch (e) {
    throw e;
  }
}

// Export both as default and named export for compatibility
export default connectDB;
export { connectDB };
