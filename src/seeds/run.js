/**
 * CLI seed thủ công.
 *
 *   npm run seed                     # chỉ insert khi toàn bộ DB trống
 *   npm run seed -- --sync-permissions   # DB có dữ liệu: chỉ cập nhật quyền role đã có
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { runSeeds } from './index.js';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set.');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.info('Connected to MongoDB.');

  const syncRolePermissions =
    process.argv.includes('--sync-permissions') || process.env.SEED_SYNC_ROLE_PERMISSIONS === 'true';

  await runSeeds({ syncRolePermissions });
}

main()
  .catch((error) => {
    console.error('[Seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
