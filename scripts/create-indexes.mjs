import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness_website';

const indexDefs = [
  { collection: 'Meal',           specs: [{ key: { userId: 1, timestamp: -1 } }] },
  { collection: 'WorkoutSession', specs: [{ key: { userId: 1, date: -1 } }, { key: { userId: 1, status: 1 } }] },
  { collection: 'Metric',         specs: [{ key: { userId: 1, timestamp: -1 } }] },
  { collection: 'FastingSession', specs: [{ key: { userId: 1 } }] },
  { collection: 'User',           specs: [{ key: { email: 1 }, unique: true }] },
];

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('fitness_website');

    for (const { collection, specs } of indexDefs) {
      const col = db.collection(collection);
      for (const spec of specs) {
        const name = await col.createIndex(spec.key, { unique: spec.unique ?? false });
        console.log(`  ✓ ${collection}.${name}`);
      }
    }

    console.log('\nAll indexes created.');
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Failed to create indexes:', err);
  process.exit(1);
});
