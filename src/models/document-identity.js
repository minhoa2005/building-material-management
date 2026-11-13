import mongoose from 'mongoose';

// Catalogue IDs and embedded item IDs remain ObjectIds. Business document refs
// also accept historical ObjectIds so existing immutable records keep working.
export const DOCUMENT_ID_PATTERN = /^[\p{L}\p{N}_]+(?: - |-)[^/\\\r\n]+(?: - |-)\d{6}(?: - |-)\d{6,}$/u;
export const isDocumentId = value => typeof value === 'string' && value.length <= 160 && DOCUMENT_ID_PATTERN.test(value);
export function databaseId(value) {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)) return new mongoose.Types.ObjectId(value);
  if (isDocumentId(value)) return value;
  throw new mongoose.Error.CastError('DocumentIdentity', value, '_id');
}
export class DocumentIdentity extends mongoose.SchemaType {
  constructor(path, options) { super(path, options, 'DocumentIdentity'); }
  cast(value) { return value == null ? value : databaseId(value); }
  checkRequired(value) { return value != null && (isDocumentId(value) || value instanceof mongoose.Types.ObjectId); }
  castForQuery(operator, value) {
    if (arguments.length === 1) return operator instanceof RegExp ? operator : this.cast(operator);
    if (!operator) return value instanceof RegExp ? value : this.cast(value);
    if (['$in','$nin','$all'].includes(operator)) return value.map(v => v instanceof RegExp ? v : this.cast(v));
    if (['$eq','$ne','$gt','$gte','$lt','$lte'].includes(operator)) return this.cast(value);
    if (['$regex','$options','$exists','$type','$not'].includes(operator)) return value;
    throw new Error('Unsupported document ID query operator: ' + operator);
  }
}
mongoose.Schema.Types.DocumentIdentity = DocumentIdentity;
