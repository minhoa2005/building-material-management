// Main registry for the approved WMSD database design.
// Register it on the connection used by a ported service, then select models
// by collection name from the returned Map.
export { registerReviewedModels, registerRebuildModels, registerMigrationModels } from './rebuild/index.js';
export { newCollections, documentCollections, workflowModelNames, modelNames } from './rebuild/collections.js';
