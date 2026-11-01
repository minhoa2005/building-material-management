import mongoose from "mongoose";
import { ApiError } from "../../shared/utils/ApiError.js";
import { currentRole, rolePermissions } from "../../shared/utils/userRole.js";

export const READ_PERMISSION = "replenishment_request:read";
export const BUSINESS_ROLES = ["OWNER", "ACCOUNTANT", "SALES", "WAREHOUSE"];
export const idString = (value) => {
  if (value == null) return null;
  const text = String(value._id ?? value);
  return /^[a-f\d]{24}$/i.test(text) ? text.toLowerCase() : text;
};
export const objectId = (value) => new mongoose.Types.ObjectId(idString(value));
export const sameId = (left, right) =>
  left != null && right != null && idString(left) === idString(right);

export function canAccessWarehouse(user, warehouseId) {
  if (warehouseId == null) return false;
  return (
    currentRole(user)?.code === "OWNER" ||
    (user.warehouseIds || []).some((id) => sameId(id, warehouseId))
  );
}

// authenticate/checkPermission authorize the request before this record filter.
export function replenishmentScope(user) {
  const role = currentRole(user);
  if (!role || !BUSINESS_ROLES.includes(role.code))
    throw new ApiError(403, "Bạn không có quyền xem yêu cầu bổ sung hàng");
  const scope = { documentKind: "REPLENISHMENT" };
  if (role.code !== "OWNER")
    scope["header.warehouseId"] = {
      $in: (user.warehouseIds || []).map(objectId),
    };
  if (role.code === "SALES" || role.code === "WAREHOUSE")
    scope.createdBy = objectId(user._id);
  return scope;
}

// Conservative projections for linked documents; reading an RR does not grant
// another UC. Unknown kinds and unresolved warehouse/ownership scopes stay hidden.
export function canReadRelated(document, user) {
  if (!document) return false;
  const permissions = {
    SALES_ORDER: "sales_order:read",
    ISSUE_REQUEST: "issue_request:read",
    PO: "purchase_order:read",
    STOCKTAKE: "stocktake:read",
    TRANSFER_REQUEST: "stock_transfer:read",
  };
  const role = currentRole(user);
  if (
    !role ||
    !rolePermissions(user).includes(permissions[document.documentKind])
  )
    return false;
  const header = document.header || {};
  const inScope = (warehouseId) => canAccessWarehouse(user, warehouseId);
  const broad = role.code === "OWNER" || role.code === "ACCOUNTANT";
  switch (document.documentKind) {
    case "SALES_ORDER":
      // SO has no warehouse header. Only return its metadata to its creator or
      // responsibility-scoped Owner/Accountant through the already-scoped RR.
      return broad || sameId(document.createdBy, user._id);
    case "ISSUE_REQUEST":
      return (
        inScope(header.requestedWarehouseId) &&
        (broad ||
          role.code === "WAREHOUSE" ||
          sameId(document.createdBy, user._id))
      );
    case "PO":
    case "STOCKTAKE":
      // rolePermissions already restricts each operation to its role catalogue.
      return inScope(header.warehouseId);
    case "TRANSFER_REQUEST":
      return (
        inScope(header.sourceWarehouseId) ||
        inScope(header.destinationWarehouseId)
      );
    default:
      return false;
  }
}
