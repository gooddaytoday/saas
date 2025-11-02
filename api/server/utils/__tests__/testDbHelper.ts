import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;

export async function setupTestDb(): Promise<string> {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  return mongoUri;
}

export async function teardownTestDb(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}
