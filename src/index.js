import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { runSeeds } from './seeds/index.js';

async function startServer() {
  await connectDatabase();

  // Tự động kiểm tra DB và insert dữ liệu mặc định còn thiếu (permission, role, kho, user).
  // Tắt bằng SEED_ON_STARTUP=false.
  const seedOnStartup = process.env.SEED_ON_STARTUP !== 'false';
  if (seedOnStartup && mongoose.connection.readyState === 1) {
    await runSeeds({
      syncRolePermissions: process.env.SEED_SYNC_ROLE_PERMISSIONS === 'true',
    }).catch((err) => {
      console.error('Failed to seed default data:', err);
    });
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
