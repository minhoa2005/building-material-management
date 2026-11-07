import { Schema, options, text } from './model-utils.js';
// Collection: uoms
export function createUomSchema() {
 const schema=new Schema({code:{...text(60),immutable:true},name:text(160),isActive:{type:Boolean,default:true,required:true}},options('uoms'));
 schema.index({code:1},{unique:true});return schema;
}
