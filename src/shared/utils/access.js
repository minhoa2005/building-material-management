import { currentRole, rolePermissions } from "./userRole.js";
import { forbiddenError, scopeError } from "./ApiError.js";
import { idString } from "./domain.js";

export function hasPermission(user, permission, roles = []) {
  const role = currentRole(user);
  return Boolean(
    user?.isActive &&
      role &&
      (!roles.length || roles.includes(role.code)) &&
      rolePermissions(user).includes(permission),
  );
}

export function requirePermission(user, permission, roles = []) {
  if (!hasPermission(user, permission, roles)) {
    throw forbiddenError();
  }
}

export function isOwner(user) {
  return currentRole(user)?.code === "OWNER";
}

export function isAssignedWarehouse(user, warehouseId) {
  return (user?.warehouseIds || []).some(
    (id) => idString(id) === idString(warehouseId),
  );
}

export function canAccessWarehouse(user, warehouseId) {
  return isOwner(user) || isAssignedWarehouse(user, warehouseId);
}

export function requireWarehouseAccess(user, warehouseId) {
  if (!canAccessWarehouse(user, warehouseId)) {
    throw scopeError();
  }
}

export function scopedWarehouseIds(user) {
  return (user?.warehouseIds || []).map((id) => idString(id));
}