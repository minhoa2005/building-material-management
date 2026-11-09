import 'dotenv/config';
import mongoose from 'mongoose';
import { registerModels } from '../src/models/registry.js';
import { backfillConversions } from '../src/migrations/conversions.js';

const [mode, target] = process.argv.slice(2);
if (!['--dry-run', '--apply'].includes(mode) || !target || process.argv.length !== 4) {
  throw new Error('Usage: node scripts/backfill-conversions.mjs --dry-run|--apply <database>');
}
if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI to the intended MongoDB database');

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  if (mongoose.connection.name !== target) throw new Error('Database name does not match MONGODB_URI');
  const models = registerModels(mongoose.connection);
  console.log(JSON.stringify({ database: target, ...await backfillConversions(models, { apply: mode === '--apply' }) }, null, 2));
} finally {
  await mongoose.disconnect();
}
