import 'dotenv/config';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { runSeeds } from '../src/seeds/index.js';

// Explicitly isolated local test data. Never reads MONGODB_URI as its target.
const uri = process.env.FE06_TEST_MONGO_URI || 'mongodb://127.0.0.1:27136/?replicaSet=uc36test';
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\//.test(uri)) throw new Error('FE06 demo server requires an explicit local MongoDB replica set.');
const dbName = 'wmsd_fe06_thunder';
await mongoose.connect(uri, { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 });
await runSeeds(); // no-op if populated; never reset user test data
const port = Number(process.env.FE06_TEST_PORT || 3016);
const server = app.listen(port, '127.0.0.1', () => console.log(`FE06 demo: http://127.0.0.1:${port}/api | DB ${dbName}`));
const stop = () => server.close(async () => { await mongoose.disconnect(); process.exit(0); });
process.on('SIGINT', stop); process.on('SIGTERM', stop);
