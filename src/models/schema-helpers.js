import { Schema, integer, text, decimal, code, rules } from "./model-utils.js";
import { documentCollections } from "./collections.js";
import { DocumentIdentity } from './document-identity.js';
export const objectId = Schema.Types.ObjectId;
export const id = (required = true) => ({
  type: Schema.Types.ObjectId,
  required,
});
export const opt = (length) => text(length, { required: false });
export const str = opt,
  optional = opt,
  optionalText = opt;
export const version = () => integer(1, { default: 1 });
export const revision = () => integer(1, { required: false });
export const quantity = () => decimal({ required: false });
export const signed = () => decimal({ signed: true, required: false });
export const zero = () => decimal({ default: "0" });
export const active = () => ({ type: Boolean, default: true, required: true });
export const uniqueCode = () => text(60, { immutable: true, unique: true });
export const dimension = () => integer(1, { required: false });
export const docType = () =>
  code([
    ...Object.values(documentCollections),
    "sales_invoices",
    "external_references",
  ]);
export const warehouse = () => ({
  warehouseId: {
    type: Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
});
export const quality = () => code(QUALITY_CODES);
export const financialStatus = () => text(20, { default: "NOT_RECORDED" });
export const documentId = (required=true) => ({type:DocumentIdentity,required});
export const subject = () => ({ subjectType: text(80), subjectId: documentId() });
export const origin = () => ({
  sourceType: text(80),
  sourceId: documentId(),
  sourceVersion: integer(1),
});
import { QUALITY_CODES } from "./constants.js";
export function dimensionsTogether(schema, fields) {
  rules(schema, function () {
    const present = fields.filter((field) => this[field] != null);
    if (present.length && present.length !== fields.length)
      this.invalidate(fields[0], "Enter all three dimensions together");
  });
}
export function embedRecordArray(parent, old, field, child) {
  child.clearIndexes();
  child.set("excludeIndexes", true);
  child.set("embeddedCollection", old);
  const modelName = {
    stock_thresholds: "StockThreshold",
    external_reference_lines: "ExternalReferenceLine",
    return_inspections: "ReturnInspection",
    external_payment_confirmations: "ExternalPaymentConfirmation",
    supplier_acknowledgements: "SupplierAcknowledgement",
    sales_order_cancellations: "SalesOrderCancellation",
    delivery_demand_reopenings: "DeliveryDemandReopening",
    delivery_commitment_transfers: "DeliveryCommitmentTransfer",
    stock_movements: "StockMovement",
    stock_holds: "StockHold",
    defect_resolution_plans: "DefectResolutionPlan",
    stocktake_resolution_plans: "StocktakeResolutionPlan",
    delivery_confirmations: "DeliveryConfirmation",
  }[old];
  child.set("embeddedModel", modelName);
  parent.add({ [field]: [child] });
  parent.index({ [field + "._id"]: 1 }, { unique: true, sparse: true });
  rules(parent, function () {
    const rows = this[field] || [];
    if (new Set(rows.map((row) => String(row._id))).size !== rows.length)
      this.invalidate(field, "Duplicate embedded ID");
    const key =
      old === "stock_thresholds"
        ? "warehouseId"
        : old === "external_reference_lines"
          ? "lineKey"
          : old === "stock_movements"
            ? "lineNo"
            : null;
    if (
      key &&
      new Set(rows.map((row) => String(row[key]))).size !== rows.length
    )
      this.invalidate(field, "Duplicate embedded key");
    const same = (a, b) => String(a) === String(b),
      ownsItem = (id) => this.items?.some((item) => same(item._id, id));
    for (const row of rows) {
      if (old === "stock_movements" && !same(row.transactionId, this._id))
        this.invalidate(field, "Movement belongs to another transaction");
      if (old === "stock_holds" && !ownsItem(row.defectReportLineId))
        this.invalidate(field, "Hold belongs to another defect report");
      if (
        old === "stocktake_resolution_plans" &&
        !same(row.header.stocktakeId, this._id)
      )
        this.invalidate(field, "Plan belongs to another stocktake");
      if (
        old === "delivery_confirmations" &&
        !same(row.header.salesOrderId, this._id)
      )
        this.invalidate(field, "Confirmation belongs to another sales order");
      if (
        old === "defect_resolution_plans" &&
        (row.items.some((item) => !ownsItem(item.details?.defectLineId)) ||
          (row.header.defectReportId &&
            !same(row.header.defectReportId, this._id)) ||
          row.sources.some(
            (source) =>
              source.subjectCollection === "defect_reports" &&
              !same(source.documentId, this._id),
          ))
      )
        this.invalidate(field, "Plan belongs to another defect report");
    }
  });
}
