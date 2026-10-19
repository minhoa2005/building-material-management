import { Schema, options, model, text, ref, decimal, sameId, rules } from './model-utils.js';

const documentLinkSchema = new Schema({
  parentDocumentId: ref('BusinessDocument'), childDocumentId: ref('BusinessDocument'), relationCode: text(30),
}, options('document_links'));
documentLinkSchema.index({ parentDocumentId: 1, childDocumentId: 1, relationCode: 1 }, { unique: true });
rules(documentLinkSchema, function preventDocumentSelfLink() {
  if (sameId(this.parentDocumentId, this.childDocumentId)) this.invalidate('childDocumentId', 'A document cannot link to itself');
});

const lineLinkSchema = new Schema({
  sourceLineId: ref('DocumentLine'), targetLineId: ref('DocumentLine'),
  relationCode: text(30), linkedQty: decimal({ positive: true }),
}, options('line_links'));
lineLinkSchema.index({ sourceLineId: 1, targetLineId: 1, relationCode: 1 }, { unique: true });
lineLinkSchema.index({ targetLineId: 1 });
rules(lineLinkSchema, function preventLineSelfLink() {
  if (sameId(this.sourceLineId, this.targetLineId)) this.invalidate('targetLineId', 'A line cannot link to itself');
});

export const DocumentLink = model('DocumentLink', documentLinkSchema);
export const LineLink = model('LineLink', lineLinkSchema);
