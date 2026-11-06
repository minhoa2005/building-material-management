import * as legacy from '../legacy/index.js';
import { Schema, integer, options, text } from '../model-utils.js';
import { catalogueSchemas } from './catalogue.js';
import { stockSchemas } from './stock.js';
import { documentCollections, collectionNames, newCollections, migrationCollections, modelNames, workflowModelNames } from './collections.js';
import { workflowSchema, invoiceSchema } from './documents.js';
import { configureRebuildReferences } from './references.js';
import { reviewedSchemaEntries } from '../reviewed-registry.js';

const registries = new WeakMap();
export function registerMigrationModels(connection) {
  return registerModels(connection, false);
}
export function registerRebuildModels(connection) {
  return registerReviewedModels(connection);
}
export function registerReviewedModels(connection) {
  return registerModels(connection, true);
}
function registerModels(connection, reviewed) {
  if (registries.has(connection)) {
    const existing = registries.get(connection);
    if (existing.reviewed !== reviewed) throw new Error('Use separate connections for migration and reviewed schema profiles');
    return existing.models;
  }
  if (Object.keys(connection.models).length) throw new Error('Use a fresh connection for rebuilt models');
  // Registration must never create collections in either the source or an unverified target.
  const registered = new Map();
  const entries = [];
  function register(name, schema, collection = schema.options.collection) {
    name = modelNames[name] ?? name;
    entries.push({ name, schema, collection });
  }
  function compile({name, schema, collection}) {
    configureRebuildReferences(schema);
    schema.set('autoCreate', false);
    schema.set('autoIndex', false);
    const model = connection.models[name] || connection.model(name, schema, collection);
    if (model.collection.name !== collection) throw new Error('Use a separate Mongoose connection for the rebuilt models');
    registered.set(collection, model);
  }
  if (reviewed) {
    for (const entry of reviewedSchemaEntries()) compile(entry);
    for (const target of newCollections) if (!registered.has(target)) throw new Error('No target model registered for ' + target);
    registries.set(connection, { reviewed, models: registered });
    return registered;
  }
  const schemas = { ...catalogueSchemas(), ...stockSchemas() };
  for (const [name, schema] of Object.entries(schemas)) register(name, schema);
  for (const old of Object.values(legacy)) {
    if (!old?.modelName) continue;
    const target = collectionNames[old.collection.name];
    if (target && !entries.some(entry => entry.collection === target)) register(old.modelName, old.schema.clone(), target);
  }
  for (const [kind, target] of Object.entries(documentCollections)) {
    const modelName = workflowModelNames[kind];
    const schema = workflowSchema(kind, target);
    register(modelName, schema);
  }
  register('SalesInvoice', invoiceSchema());
  if (!entries.some(entry => entry.collection === 'return_source_locks')) register('ReturnSourceLock', new Schema({
    sourceKey: text(200, { unique: true }), sourceKind: text(60), sourceDocumentId: Schema.Types.ObjectId,
    sourceItemId: Schema.Types.ObjectId, version: integer(0, { default: 0 }), lastOperationId: Schema.Types.ObjectId,
  }, options('return_source_locks')));
  for (const entry of entries) compile(entry);
  for (const target of migrationCollections) {
    if (!registered.has(target)) throw new Error('No target model registered for ' + target);
  }
  registries.set(connection, { reviewed, models: registered });
  return registered;
}
