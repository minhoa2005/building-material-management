// Main registry for the approved WMSD database design.
// Register it on the connection used by a ported service, then select models
// by collection name from the returned Map.
export { registerModels, registerModels as registerReviewedModels } from './registry.js';
export { newCollections, documentCollections, workflowModelNames, modelNames } from './collections.js';
