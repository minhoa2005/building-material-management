import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

async function startServer() {
  await connectDatabase();

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.info(`API server listening on port ${port}.`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API server.', error);
  process.exitCode = 1;
});
