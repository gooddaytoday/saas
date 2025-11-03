import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let mongoServer: MongoMemoryServer | null = null;
let mongoClient: MongoClient | null = null;

/**
 * Setup test database for e2e testing
 * Creates an in-memory MongoDB instance
 */
export async function setupE2EDatabase(): Promise<string> {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  return mongoUri;
}

/**
 * Teardown test database
 * Disconnects from MongoDB and stops the memory server
 */
export async function teardownE2EDatabase(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
  }
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
  if (!mongoClient) {
    throw new Error('Database client is not connected');
  }

  const db = mongoClient.db();
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
  if (!mongoServer) {
    throw new Error('Database is not connected');
  }
  // Return the connection string from MongoMemoryServer
  return mongoServer.getUri();
}

/**
 * Check if database is connected
 */
export function isDbConnected(): boolean {
  return mongoClient !== null;
}
