import mongoose from 'mongoose';

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    console.info('MONGODB_URI is not set; skipping MongoDB connection.');
    return;
  }

  await mongoose.connect(uri);
  console.info('Connected to MongoDB.');
}
