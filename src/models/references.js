import mongoose from 'mongoose';
import { DocumentIdentity, isDocumentId } from './document-identity.js';
import { workflowModelNames } from './collections.js';
import { Schema, code } from './model-utils.js';
import { modelNames } from './collections.js';
import { embeddedTables } from './consolidation.js';

// A business document is now stored in its own collection, and its items are
// embedded. These references are resolved through explicit source links, not
// Mongoose populate against the removed generic collections.
export function configureReferences(schema, seen = new Set()) {
  if (seen.has(schema)) return;
  seen.add(schema);
  if(schema.path('documentNo')) {
    schema.remove('_id');
    schema.add({_id:{type:DocumentIdentity,default:function(){return isDocumentId(this.documentNo)?this.documentNo:new mongoose.Types.ObjectId();}}});
    schema.pre('validate',function(){if(isDocumentId(this._id)&&this.documentNo!==this._id)this.invalidate('documentNo','Mã chứng từ phải khớp _id bất biến');});
  }
  const documentModels=new Set([...Object.values(workflowModelNames),'GoodsReceipt','OtherGoodsReceipt','SalesInvoice','Handover','SalesOrderCancellation']);
  const genericDocumentFields=new Set(['documentId','sourceId','subjectId','entityId','sourceDocumentId','relatedDocumentId','resolutionDocumentId']);
  const replacements=[];
  schema.eachPath((name,path) => {
    if (path.schema) configureReferences(path.schema,seen);
    const options = path.options;
    const elementOptions = path.$embeddedSchemaType?.options;
    const rawArray=Array.isArray(options.type)&&options.type[0]&&typeof options.type[0]==='object'?options.type[0]:null;
    const refName=options.ref??elementOptions?.ref??rawArray?.ref;
    if(name!=='_id'&&(documentModels.has(modelNames[refName]??refName)||refName==='BusinessDocument'||(genericDocumentFields.has(name)||/(DocumentId|OrderId|RequestId|ReceiptId|DispatchId|StocktakeId|PlanId|RequirementId|InspectionId|ArrivalId|ReturnId|TaskId)$/i.test(name)))) {
      const definition={...options,type:path.$embeddedSchemaType?[DocumentIdentity]:(rawArray?[DocumentIdentity]:DocumentIdentity)};
      delete definition.auto;
      const resolved=modelNames[refName]??refName;
      if(refName==='BusinessDocument'||Object.values(embeddedTables).some(e=>e[2]===resolved))delete definition.ref;else if(resolved)definition.ref=resolved;
      replacements.push([name,definition]);
    }
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
  for(const [name,definition]of replacements){schema.remove(name);schema.add({[name]:definition});}
  if (schema.path('ownerPartyId')) {
    schema.remove('ownerPartyId');
    schema.add({ ownerType:code(['STORE','SUPPLIER','CUSTOMER'],{required:false}), ownerId:{type:Schema.Types.ObjectId, default:null} });
  }
  for (const discriminator of Object.values(schema.discriminators || {})) configureReferences(discriminator,seen);
  // Mongoose caches flattened nested paths when a schema is attached. Refresh
  // those entries after replacing typed document references in the child schema.
  schema.eachPath((name,path)=>{if(!path.schema)return;const target=path.$isSingleNested?schema.singleNestedPaths:schema.subpaths;for(const [key,value]of Object.entries({...path.schema.paths,...path.schema.singleNestedPaths,...path.schema.subpaths}))target[name+'.'+key]=value;});
}
