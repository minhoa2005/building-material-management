// Collection: document_sequences
import { Schema, options, integer, text } from './model-utils.js';
export function createDocumentSequenceSchema() {
  return new Schema({_id:{type:String,required:true},soCuoi:integer(0),tenLoaiPhieu:text(160),maDonVi:text(80),ky:text(6)},options('document_sequences'));
}
