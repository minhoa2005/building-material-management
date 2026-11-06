import {
  DocumentLine,
  Lot,
  StockBalance,
} from "../../models/legacy/index.js";

// Writers call this inside the same transaction before creating a line or
// balance that references the lot. It closes the "checked unused, then another
// writer used it" race with UC-27's versioned identity update.
export async function lockLotIdentity(lotId, session) {
  const result = await Lot.updateOne(
    { _id: lotId },
    { $set: { identityLocked: true } },
    { session },
  );
  if (result.matchedCount !== 1) {
    throw new Error("Lot identity lock failed: lot no longer exists");
  }
}

export async function lotHasReferences(lotId, session) {
  const line = await DocumentLine.exists({ lotId }).session(session);
  if (line) return true;
  const balance = await StockBalance.exists({ lotId }).session(session);
  return Boolean(balance);
}