import mongoose from 'mongoose';

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    console.info('MONGODB_URI is not set; skipping MongoDB connection.');
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.info('Connected to MongoDB.');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.warn('Continuing server startup without active database connection.');
  }
}
