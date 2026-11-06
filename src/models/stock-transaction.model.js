import { Schema, options, text, ref, date, appendOnly } from "./model-utils.js";
import { objectId, embedRecordArray } from "./schema-helpers.js";

import { createStockMovementSchema } from "./embedded/stock-movement.model.js";

// Collection: stock_transactions
export function createStockTransactionSchema() {
  const transactions = new Schema(
    {
      sourceType: text(80),
      sourceId: { type: objectId, required: true },
      operation: text(40),
      eventKey: text(100),
      requestKey: text(120, { unique: true }),
      requestHash: text(64, { match: /^[a-f\d]{64}$/i }),
      performedBy: ref("User"),
      occurredAt: date(),
      recordedAt: date(),
      reversedTransactionId: ref("PostingBatch", false),
    },
    options("stock_transactions"),
  );
  transactions.index(
    { sourceId: 1, operation: 1, eventKey: 1 },
    { unique: true },
  );
  transactions.index(
    { reversedTransactionId: 1 },
    {
      unique: true,
      partialFilterExpression: { reversedTransactionId: { $type: "objectId" } },
    },
  );
  appendOnly(transactions);
  embedRecordArray(
    transactions,
    "stock_movements",
    "movements",
    createStockMovementSchema(),
  );
  transactions.index({ "movements.fromBalanceId": 1, occurredAt: 1 });
  transactions.index({ "movements.toBalanceId": 1, occurredAt: 1 });
  return transactions;
}
