import {
  Product,
  Warehouse,
  Lot,
  Location,
  Party,
  StockAccount,
  StockBalance,
  Reservation,
  LocationLock,
  DefectHold,
} from "../../models/index.js";
import { exact } from "../../models/model-utils.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { idString } from "./replenishment.access.js";

export function sumAvailableBalances(
  balances,
  reservations,
  heldBalanceIds = [],
  lockedAccountIds = [],
) {
  const held = new Set(heldBalanceIds.map(idString));
  const locked = new Set(lockedAccountIds.map(idString));
  const reserved = new Map();
  const totals = new Map();
  for (const reservation of reservations) {
    if (reservation.status !== "ACTIVE") continue;
    const key = idString(reservation.balanceId);
    reserved.set(
      key,
      (reserved.get(key) || exact("0")).plus(exact(reservation.qtyBase)),
    );
  }
  for (const balance of balances) {
    if (
      held.has(idString(balance._id)) ||
      locked.has(idString(balance.accountId))
    )
      continue;
    const free = exact(balance.qtyBase).minus(
      reserved.get(idString(balance._id)) || exact("0"),
    );
    if (!free.isFinite() || free.isNegative()) {
      throw new ApiError(
        500,
        "Dữ liệu tồn kho không nhất quán: lượng giữ hàng vượt tồn khả dụng",
      );
    }
    const productId = idString(balance.productId);
    totals.set(productId, (totals.get(productId) || exact("0")).plus(free));
  }
  return new Map([...totals].map(([key, value]) => [key, value.toFixed()]));
}

// A live reference for free stock, not a promise to reserve or fulfil a demand.
// Every query is batched by product/warehouse, independent of the RR line count.
export async function getCurrentAvailability(warehouseId, productIds) {
  const uniqueIds = [...new Set(productIds.map(idString))];
  const zero = new Map(uniqueIds.map((id) => [id, "0"]));
  if (!uniqueIds.length) return { quantities: zero, computedAt: new Date() };
  const [warehouse, products, owner, locations] = await Promise.all([
    Warehouse.findOne({ _id: warehouseId, isActive: true })
      .select("_id")
      .lean(),
    Product.find({ _id: { $in: uniqueIds }, isActive: true })
      .select("_id")
      .lean(),
    Party.findOne({ kind: "STORE" }).select("_id").lean(),
    Location.find({
      warehouseId,
      kind: "STORAGE",
      allocatable: true,
      isActive: true,
    })
      .select("_id")
      .lean(),
  ]);
  if (!warehouse || !owner || !products.length || !locations.length) {
    return { quantities: zero, computedAt: new Date() };
  }
  const [lots, accounts, locks] = await Promise.all([
    Lot.find({
      productId: { $in: products.map((item) => item._id) },
      identificationStatus: "VERIFIED",
    })
      .select("_id productId")
      .lean(),
    StockAccount.find({
      locationId: { $in: locations.map((item) => item._id) },
      transitDispatchLineId: null,
    })
      .select("_id locationId")
      .lean(),
    LocationLock.find({
      locationId: { $in: locations.map((item) => item._id) },
    })
      .select("locationId")
      .lean(),
  ]);
  const balances = await StockBalance.find({
    accountId: { $in: accounts.map((item) => item._id) },
    lotId: { $in: lots.map((item) => item._id) },
    ownerPartyId: owner._id,
    qualityCode: "GOOD",
  })
    .select("_id accountId lotId qtyBase")
    .lean();
  const balanceIds = balances.map((item) => item._id);
  const [reservations, holds] = await Promise.all([
    Reservation.find({ balanceId: { $in: balanceIds }, status: "ACTIVE" })
      .select("balanceId qtyBase status")
      .lean(),
    DefectHold.find({ balanceId: { $in: balanceIds }, status: "ACTIVE" })
      .select("balanceId")
      .lean(),
  ]);
  const lotProducts = new Map(
    lots.map((item) => [idString(item._id), item.productId]),
  );
  const lockedLocations = new Set(
    locks.map((item) => idString(item.locationId)),
  );
  const totals = sumAvailableBalances(
    balances.map((item) => ({
      ...item,
      productId: lotProducts.get(idString(item.lotId)),
    })),
    reservations,
    holds.map((item) => item.balanceId),
    accounts
      .filter((item) => lockedLocations.has(idString(item.locationId)))
      .map((item) => item._id),
  );
  return { quantities: new Map([...zero, ...totals]), computedAt: new Date() };
}
