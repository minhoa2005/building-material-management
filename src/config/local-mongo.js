import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Use the MongoDB service the team already opens with Compass by default.
// Transactions still work when that service is configured as a replica set.
export const LOCAL_MONGO_PORT = 27017;
export const LOCAL_REPLICA_SET = undefined;
export const LOCAL_DEMO_DATABASE = 'wmsd_demo_tile_shop_v8';
export const LOCAL_MONGO_ROOT = resolve(fileURLToPath(new URL('../../',import.meta.url)),'.local','mongodb');
export const LOCAL_DEMO_URI = `mongodb://localhost:${LOCAL_MONGO_PORT}/${LOCAL_DEMO_DATABASE}`;
export const LOCAL_SEED_URI = `mongodb://localhost:${LOCAL_MONGO_PORT}/admin`;

export function isLoopbackMongoUri(uri) {
  try {
    const url=new URL(uri);
    return url.protocol==='mongodb:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname.toLowerCase());
  } catch {return false;}
}
export function requireLoopbackMongoUri(uri) {
  if(!isLoopbackMongoUri(uri)) throw new Error('This command only accepts a single localhost MongoDB endpoint');
}
