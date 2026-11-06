import { modelSchemaEntries } from './registry-entries.js';
import { configureReferences } from './references.js';

const registries = new WeakMap();

// One schema profile, on the application's connection or an isolated test connection.
// Merely registering models must never create collections or indexes.
export function registerModels(connection) {
  if (registries.has(connection)) return registries.get(connection);
  if (Object.keys(connection.models).length) throw new Error('Use a fresh connection for WMSD models');
  const models = new Map();
  for (const { name, schema, collection } of modelSchemaEntries()) {
    configureReferences(schema);
    schema.set('autoCreate', false);
    schema.set('autoIndex', false);
    models.set(collection, connection.model(name, schema, collection));
  }
  registries.set(connection, models);
  return models;
}
