import * as legacy from '../legacy/index.js';
import { Schema, integer, options, text } from '../model-utils.js';
import { catalogueSchemas } from './catalogue.js';
import { stockSchemas } from './stock.js';
import { documentCollections, collectionNames, newCollections, modelNames, workflowModelNames } from './collections.js';
import { workflowSchema, invoiceSchema } from './documents.js';
import { configureRebuildReferences } from './references.js';
import { reviewedSupportSchemas } from './reviewed-support.js';
import { reviewedEventSchemas } from './reviewed-events.js';
import { addReviewedWorkflowFields } from './reviewed-workflows.js';

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
  function register(name, schema, collection = schema.options.collection) {
    name = modelNames[name] ?? name;
    configureRebuildReferences(schema);
    schema.set('autoCreate', false);
    schema.set('autoIndex', false);
    const model = connection.models[name] || connection.model(name, schema, collection);
    if (model.collection.name !== collection) throw new Error('Use a separate Mongoose connection for the rebuilt models');
    registered.set(collection, model);
  }
  const schemas = { ...catalogueSchemas(), ...stockSchemas(), ...(reviewed ? reviewedSupportSchemas() : {}), ...(reviewed ? reviewedEventSchemas() : {}) };
  for (const [name, schema] of Object.entries(schemas)) register(name, schema);
  for (const old of Object.values(legacy)) {
    if (!old?.modelName) continue;
    const target = collectionNames[old.collection.name];
    if (target && !registered.has(target)) register(old.modelName, old.schema.clone(), target);
  }
  for (const [kind, target] of Object.entries(documentCollections)) {
    const modelName = workflowModelNames[kind];
    const schema = workflowSchema(kind, target);
    register(modelName, reviewed ? addReviewedWorkflowFields(schema, kind) : schema);
  }
  register('SalesInvoice', invoiceSchema());
  if (!registered.has('return_source_locks')) register('ReturnSourceLock', new Schema({
    sourceKey: text(200, { unique: true }), sourceKind: text(60), sourceDocumentId: Schema.Types.ObjectId,
    sourceItemId: Schema.Types.ObjectId, version: integer(0, { default: 0 }), lastOperationId: Schema.Types.ObjectId,
  }, options('return_source_locks')));
  for (const target of newCollections) {
    if (!registered.has(target)) throw new Error('No target model registered for ' + target);
  }
  registries.set(connection, { reviewed, models: registered });
  return registered;
}
