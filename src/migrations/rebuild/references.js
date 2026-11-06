import { embeddedTables, expandEmbedded } from '../../models/rebuild/consolidation.js';
function getPath(row, path) {
  return path.split('.').reduce((value,key) => value?.[key],row);
}

// Verify all typed references against the actual target graph, including the
// IDs retained by embedded items and handovers.
export function verifyReferences(target, models) {
  const expanded = expandEmbedded(target);
  const idsByModel = new Map(), documents = new Set(), items = new Set();
  function remember(row) {
    documents.add(String(row._id));
    for (const item of row.items || []) items.add(String(item._id));
    for (const handover of row.handovers || []) remember(handover);
  }
  for (const [name,Model] of models) {
    idsByModel.set(Model.modelName,new Set(target[name].map(row => String(row._id))));
    for (const row of target[name]) if (row.documentKind) remember(row);
  }
  for (const [old, [, , modelName]] of Object.entries(embeddedTables)) {
    const rows = target[old] || expanded[old];
    idsByModel.set(modelName, new Set(rows.map(row => String(row._id))));
    idsByModel.set(old, new Set(rows.map(row => String(row._id))));
    for (const row of rows) if (row.documentKind) remember(row);
  }
  const missing = [];
  function checkSchema(schema,row,collection,rootId) {
    const key = schema.options.discriminatorKey;
    const discriminator = key && Object.values(schema.discriminators || {}).find(child => child.discriminatorMapping?.value === row[key]);
    if (discriminator) schema = discriminator;
    schema.eachPath((pathName,path) => {
      const value = getPath(row,pathName);
      if (value == null) return;
      if (path.schema) {
        for (const child of Array.isArray(value) ? value : [value]) checkSchema(path.schema,child,collection,rootId);
        return;
      }
      const options = path.$embeddedSchemaType?.options || path.options;
      const reference = options.ref;
      const logical = options.logicalReference;
      if (!reference && !logical && !options.embeddedTarget) return;
      const known = logical === 'document' ? documents : logical === 'item' ? items : idsByModel.get(options.embeddedTarget || reference);
      if (!known) throw new Error('Unknown target model for reference ' + reference);
      for (const item of Array.isArray(value) ? value : [value]) {
        if (!known.has(String(item))) missing.push({collection,id:String(rootId),field:pathName});
      }
    });
    if (row.ownerType && row.ownerId) {
      const owner = row.ownerType === 'CUSTOMER' ? 'Customer' : 'Supplier';
      if (!idsByModel.get(owner).has(String(row.ownerId))) missing.push({collection,id:String(rootId),field:'ownerId'});
    }
  }
  for (const [name,Model] of models) for (const row of target[name]) checkSchema(Model.schema,row,name,row._id);
  return missing;
}
