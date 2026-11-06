import { Schema, code } from '../model-utils.js';
import { modelNames } from './collections.js';
import { embeddedTables } from './consolidation.js';

// A business document is now stored in its own collection, and its items are
// embedded. These references are resolved through explicit source links, not
// Mongoose populate against the removed generic collections.
export function configureRebuildReferences(schema, seen = new Set()) {
  if (seen.has(schema)) return;
  seen.add(schema);
  schema.eachPath((name,path) => {
    if (path.schema) configureRebuildReferences(path.schema,seen);
    const options = path.options;
    const elementOptions = path.$embeddedSchemaType?.options;
    for (const value of [options,elementOptions]) {
      if (!value?.ref) continue;
      value.ref = modelNames[value.ref] ?? value.ref;
      const embedded = Object.entries(embeddedTables).find(([, entry]) => entry[2] === value.ref);
      if (embedded) {
        value.embeddedTarget = embedded[0];
        delete value.ref;
        continue;
      }
      if (value.ref === 'Party') {
        const typed = { supplierId:'Supplier', customerId:'Customer' }[name];
        if (typed) value.ref = typed;
        else if (name !== 'ownerPartyId') throw new Error('Unmapped party reference: ' + name);
      }
      if (['BusinessDocument','DocumentLine'].includes(value.ref)) {
        value.logicalReference = value.ref === 'BusinessDocument' ? 'document' : 'item';
        delete value.ref;
      }
    }
  });
  if (schema.path('ownerPartyId')) {
    schema.remove('ownerPartyId');
    schema.add({ ownerType:code(['STORE','SUPPLIER','CUSTOMER'],{required:false}), ownerId:{type:Schema.Types.ObjectId, default:null} });
  }
  for (const discriminator of Object.values(schema.discriminators || {})) configureRebuildReferences(discriminator,seen);
}
