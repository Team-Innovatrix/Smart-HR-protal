import mongoose, { Connection } from 'mongoose';

// Load environment variables only on server side
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { config } = require('dotenv');
  config({ path: '.env.local' });
}

// In production (Vercel), environment variables are set directly
// In development, it will use .env.local if available
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'hr';

// Global variable for memory URI across hot reloads
declare global {
  var __MONGO_MEM_URI__: string | undefined;
}

// Enhanced environment validation with detailed logging
if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI environment variable is not set');
} else {
  const isValidMongoUri = MONGODB_URI.startsWith('mongodb://') || MONGODB_URI.startsWith('mongodb+srv://');
  if (!isValidMongoUri) {
    console.warn('⚠️ Invalid MongoDB URI format');
  }

  if (process.env.NODE_ENV === 'production' && (MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1'))) {
    console.warn('⚠️ WARNING: Using localhost MongoDB URI in production environment!');
  }
}

console.log('🔍 MongoDB Configuration:', {
  hasUri: !!MONGODB_URI,
  dbName: DB_NAME,
  environment: process.env.NODE_ENV,
});

// Extend the global type to include mongoose and additional cached connections
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose | null> | null;
  } | undefined;
  var careers: {
    conn: Connection | null;
    promise: Promise<Connection | null> | null;
  } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Type assertion to ensure cached is properly typed
const typedCached = cached as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
};

async function connectDB() {
  const startTime = Date.now();

  try {
    // Check if we already have a connection
    if (typedCached.conn) {
      return typedCached.conn;
    }

    // Create new connection if none exists
    if (!typedCached.promise) {
      if (process.env.USE_LOCAL_MEM_DB === 'true' && !global.__MONGO_MEM_URI__) {
        console.log('📦 Starting MongoDB Memory Server...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const memoryServer = await MongoMemoryServer.create();
        global.__MONGO_MEM_URI__ = memoryServer.getUri();
        console.log('🚀 Memory Server Running at:', global.__MONGO_MEM_URI__);
      }
      
      const activeUri = global.__MONGO_MEM_URI__ || MONGODB_URI;

      const opts = {
        bufferCommands: false,
        dbName: DB_NAME,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
        w: 'majority' as const,
        heartbeatFrequencyMS: 10000,
        connectTimeoutMS: 10000,
        ssl: activeUri?.includes('mongodb+srv') || activeUri?.includes('ac-') ? true : false,
      };

      typedCached.promise = mongoose.connect(activeUri!, opts);
    }

    typedCached.conn = await typedCached.promise;
    
    // Verify connection is actually established
    if (!typedCached.conn || typedCached.conn.connection.readyState !== 1) {
      throw new Error(`MongoDB connection not ready. State: ${typedCached.conn?.connection.readyState}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ MongoDB connected (${duration}ms)`);


    // Set up connection event listeners for production monitoring
    if (process.env.NODE_ENV === 'production') {
      typedCached.conn.connection.on('disconnected', () => {
        console.warn(`⚠️ MongoDB disconnected`);
      });

      typedCached.conn.connection.on('error', (error) => {
        console.error(`❌ MongoDB error:`, error);
      });
    }

    return typedCached.conn;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ MongoDB connection error (${duration}ms):`, error instanceof Error ? error.message : 'Unknown error');

    // Reset the promise so we can retry
    typedCached.promise = null;
    
    // Provide helpful error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('MongoDB connection refused. Check if MongoDB is running and accessible.');
      } else if (error.message.includes('ENOTFOUND')) {
        throw new Error('MongoDB host not found. Check your connection string and network access.');
      } else if (error.message.includes('ETIMEDOUT')) {
        throw new Error('MongoDB connection timeout. Check network connectivity and firewall settings.');
      } else if (error.message.includes('Authentication failed')) {
        throw new Error('MongoDB authentication failed. Check username, password, and database permissions.');
      }
    }
    
    throw error;
  }
}

export default connectDB;

// Separate cached connection for the 'careers' database
let careersCached = global.careers;

if (!careersCached) {
  careersCached = global.careers = { conn: null, promise: null };
}

export async function connectCareersDB(): Promise<Connection> {
  const startTime = Date.now();
  
  try {
    if (careersCached!.conn) {
      return careersCached!.conn as Connection;
    }

    if (!careersCached!.promise) {
      const activeUri = global.__MONGO_MEM_URI__ || MONGODB_URI;
      
      const opts = {
        bufferCommands: false,
        dbName: 'careers',
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
        w: 'majority',
        ssl: activeUri?.includes('mongodb+srv') || activeUri?.includes('ac-') ? true : false
      } as const;
      
      const connection = mongoose.createConnection(activeUri!, opts);
      careersCached!.promise = connection.asPromise();
    }

    careersCached!.conn = await careersCached!.promise!;
    
    const duration = Date.now() - startTime;
    console.log(`✅ Careers DB connected (${duration}ms)`);
    
    return careersCached!.conn as Connection;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Careers DB connection error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    });
    
    careersCached!.promise = null;
    throw error;
  }
}
