import { Schema, options, text, decimal } from './model-utils.js';
// Collection: uoms
export function createUomSchema() {
 // areaMm2: mm² of one unit; null = not an area unit (M2 = 1000000). Immutable: generated conversions depend on it.
 const schema=new Schema({code:{...text(60),immutable:true},name:text(160),isActive:{type:Boolean,default:true,required:true},isCarton:{type:Boolean,default:false,required:true},areaMm2:decimal({positive:true,required:false,default:null,immutable:true})},options('uoms'));
 schema.index({code:1},{unique:true});return schema;
}
