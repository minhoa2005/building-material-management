// Historical schema contract used only by the migration builder. Never connects to MongoDB.
import mongoose from 'mongoose';
export * from '../../model-utils.js';
const connection = mongoose.createConnection();
export const model = (name, schema) => connection.models[name] || connection.model(name, schema);
