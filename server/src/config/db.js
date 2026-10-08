import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to default URI (${ENV.MONGODB_URI}): ${error.message}`);

    // In development, if local mongod is not present, fall back to MongoMemoryServer
    if (ENV.NODE_ENV === 'development') {
      try {
        console.log(`[Database] Spawning MongoMemoryServer fallback for seamless local development...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        const memConn = await mongoose.connect(memoryUri);
        console.log(`[Database] In-memory MongoDB Connected: ${memoryUri}`);
        return memConn;
      } catch (memError) {
        console.error(`[Database Error] Could not start in-memory MongoDB: ${memError.message}`);
      }
    }

    if (ENV.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};
