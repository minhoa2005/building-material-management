import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { runSeeds } from './seeds/index.js';

async function startServer() {
  await connectDatabase();

  // Chỉ insert toàn bộ dữ liệu demo nếu database hoàn toàn trống.
  // Tắt bằng SEED_ON_STARTUP=false.
  const seedOnStartup = process.env.SEED_ON_STARTUP !== 'false';
  if (seedOnStartup && mongoose.connection.readyState === 1) {
    await runSeeds().catch((err) => {
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
