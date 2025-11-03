import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

/**
 * Setup test database for e2e testing
 * Creates an in-memory MongoDB instance
 */
export async function setupE2EDatabase(): Promise<string> {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  return mongoUri;
}

/**
 * Teardown test database
 * Disconnects from MongoDB and stops the memory server
 */
export async function teardownE2EDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

/**
 * Clear all collections in the database
 * Useful for resetting database state between tests
 */
export async function clearAllCollections(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected');
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection object is not available');
  }

  const collections = await db.listCollections().toArray();

  for (const collectionInfo of collections) {
    const collection = db.collection(collectionInfo.name);
    await collection.deleteMany({});
  }
}

/**
 * Get MongoDB URI from active connection
 */
export function getMongoUri(): string {
  if (!mongoose.connection.host) {
    throw new Error('Database is not connected');
  }
  // Return the connection string from mongoose connection
  const connection = mongoose.connection;
  return connection.host ? `mongodb://${connection.host}:${connection.port}/${connection.name}` : '';
}

/**
 * Check if database is connected
 */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
