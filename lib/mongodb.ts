import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

let cachedDb: Db | null = null;
let cachedClient: MongoClient | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    console.log('Attempting MongoDB connection...');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    console.log('URI:', uri!.replace(/:[^:]*@/, ':***@'));
    cachedClient = new MongoClient(uri as string);
    await cachedClient.connect();
    cachedDb = cachedClient.db('fitness_website');
    console.log('✓ Connected to MongoDB successfully');
    return cachedDb;
  } catch (error) {
    console.error('✗ Failed to connect to MongoDB:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function getCollection(collectionName: string) {
  const db = await connectToDatabase();
  return db.collection(collectionName);
}
