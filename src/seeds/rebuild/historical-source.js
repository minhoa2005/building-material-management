// Synthetic pre-merge source for the approved v8 scenario and historical migration tests.
// Independent of the evolving runtime PO seed. Never reads a live database.
import { readFileSync } from 'node:fs';
import mongoose from 'mongoose';
export function buildHistoricalSource() {
  return mongoose.mongo.BSON.EJSON.parse(readFileSync(new URL('./fixtures/legacy-v8.ejson', import.meta.url), 'utf8'), { relaxed: false });
}
