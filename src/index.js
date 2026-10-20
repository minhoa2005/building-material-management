import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { seedRolesAndUsers } from './seeds/user.seed.js';

async function startServer() {
  await connectDatabase();
  await seedRolesAndUsers().catch((err) => {
    console.error('Failed to seed default roles and users:', err);
  });

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.info(`API server listening on port ${port}.`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API server.', error);
  process.exitCode = 1;
});
