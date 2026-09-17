import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import { connectDatabase } from './config/database.js';
import healthRouter from './routes/health.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/api/health', healthRouter);

app.use((_request, response) => {
  response.status(404).json({ message: 'Route not found' });
});

app.use((error, _request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  console.error(error);
  return response.status(500).json({ message: 'Internal server error' });
});

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
