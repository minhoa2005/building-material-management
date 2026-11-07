import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { runSeeds } from './seeds/index.js';
import { syncPasswordsOnStartup } from './config/seed-password-startup.js';

async function startServer() {
  await connectDatabase();

  // Khởi động database: kiểm tra xem đã có dữ liệu trong DB chưa, nếu chưa có mới chạy seed.
  const disableAutoSeed = process.env.AUTO_SEED === 'false' || process.env.SEED_ON_STARTUP === 'false';
  if (!disableAutoSeed && mongoose.connection.readyState === 1) {
    await runSeeds().catch((err) => {
      console.error('Failed to seed default data on startup:', err);
    });
  }

  const passwordSync = await syncPasswordsOnStartup(mongoose.connection, {
    uri: process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV,
  });
  if (!passwordSync.skipped) {
    console.info('Seed password sync:', passwordSync.accounts);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.info(`API server listening on port ${port}.`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API server.', error);
  process.exitCode = 1;
});
