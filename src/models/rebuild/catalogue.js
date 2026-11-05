import { Schema, code, decimal, embeddedOptions, exact, integer, options, ref, refs, rules, text } from '../model-utils.js';

const version = () => integer(1, { default: 1 });
const active = () => ({ type: Boolean, default: true, required: true });
const optionalText = length => text(length, { required: false });
const uniqueCode = () => text(60, { immutable: true, unique: true });
const dimension = () => integer(1, { required: false });
const catalogue = (name, fields) => new Schema(fields, options(name));

function dimensionsTogether(schema, fields) {
  rules(schema, function () {
    const present = fields.filter(field => this[field] != null);
    if (present.length && present.length !== fields.length) this.invalidate(fields[0], 'Enter all three dimensions together');
  });
}

export const packaging = new Schema({
  packageUnit: text(60), baseUnitsPerPackage: decimal({ positive: true, scale: 12, precision: 24 }),
  outerLengthMm: dimension(), outerWidthMm: dimension(), outerHeightMm: dimension(),
}, embeddedOptions);
dimensionsTogether(packaging, ['outerLengthMm', 'outerWidthMm', 'outerHeightMm']);

export function catalogueSchemas() {
  const users = catalogue('users', {
    username: uniqueCode(), fullName: text(160), passwordHash: text(255, { select: false, trim: false }),
    roleId: ref('Role'), warehouseIds: refs('Warehouse'), phone: optionalText(30), email: optionalText(254),
    isActive: active(), version: version(),
  });
  const roles = catalogue('roles', {
    code: uniqueCode(), name: text(160), description: optionalText(500), permissionIds: refs('Permission'),
    isSystemRole: { type: Boolean, default: false }, isActive: active(), version: version(),
  });
  const permissions = catalogue('permissions', {
    code: text(100, { unique: true, immutable: true }), name: text(250), description: optionalText(500),
    featureCode: optionalText(30), isActive: active(),
  });
  const warehouses = catalogue('warehouses', {
    code: uniqueCode(), name: text(160), address: optionalText(500), description: optionalText(500),
    lengthMm: dimension(), widthMm: dimension(), clearHeightMm: dimension(), isActive: active(), version: version(),
  });
  dimensionsTogether(warehouses, ['lengthMm', 'widthMm', 'clearHeightMm']);
  const locations = catalogue('warehouse_locations', {
    warehouseId: ref('Warehouse'), code: text(50), name: optionalText(160), areaCode: optionalText(50),
    locationType: code(['RECEIVING','STORAGE','STAGING','QUARANTINE','CUSTODY']),
    isPickable: { type: Boolean, default: false }, description: optionalText(500), isActive: active(),
    version: version(), operationVersion: integer(0, { default: 0 }),
    usableLengthMm: dimension(), usableWidthMm: dimension(), usableHeightMm: dimension(),
  });
  dimensionsTogether(locations, ['usableLengthMm','usableWidthMm','usableHeightMm']);
  locations.index({ warehouseId: 1, code: 1 }, { unique: true });
  rules(locations, function () {
    if (this.isPickable && this.locationType !== 'STORAGE') this.invalidate('isPickable', 'Only storage bins are pickable');
  });
  const products = catalogue('products', {
    sku: text(60), manufacturerCode: text(100), name: text(200), material: optionalText(160),
    baseUnit: text(60), wholeBaseUnits: { type: Boolean, required: true, default: true },
    nominalSize: optionalText(60), isActive: active(), version: version(),
  });
  products.index({ manufacturerCode: 1, sku: 1 }, { unique: true });
  const common = { code: uniqueCode(), name: text(200), version: version() };
  const customers = catalogue('customers', { ...common, phone: text(30) });
  const suppliers = catalogue('suppliers', {
    ...common, contactName: optionalText(160), phone: optionalText(30), email: optionalText(254),
    address: optionalText(500), status: code(['PENDING','ACTIVE','INACTIVE'], { default: 'PENDING' }),
  });
  const teams = catalogue('delivery_teams', { ...common, isActive: active() });
  const stacks = catalogue('storage_stacks', {
    locationId: ref('Location'), code: uniqueCode(), occupiedLengthMm: integer(1), occupiedWidthMm: integer(1),
    occupiedHeightMm: integer(1), volumeMethod: code(['PACKAGES','MEASURED']),
    supportVolumeMm3: decimal({ required() { return this.volumeMethod === 'PACKAGES'; } }),
    isCleared: { type: Boolean, default: false }, measurementNote: optionalText(1000),
    createdBy: ref('User'), updatedBy: ref('User', false), version: version(),
  });
  stacks.index({ locationId: 1, isCleared: 1 });
  const stackItems = catalogue('storage_stack_items', {
    stackId: ref('StorageStack'), balanceId: ref('StockBalance'), packagingState: code(['SEALED','OPEN','LOOSE']),
    packagingSnapshot: packaging, packagingKey: optionalText(300),
    sealedPackCount: integer(0, { required: false }), quantityBase: decimal(), createdBy: ref('User'),
    updatedBy: ref('User', false), version: version(),
  });
  stackItems.index({ stackId: 1, balanceId: 1, packagingState: 1, packagingKey: 1 }, { unique: true });
  rules(stackItems, function () {
    if (this.packagingState === 'SEALED') {
      const perPack = this.packagingSnapshot?.baseUnitsPerPackage;
      if (perPack == null || this.sealedPackCount == null || !exact(perPack).mul(this.sealedPackCount).eq(String(this.quantityBase))) {
        this.invalidate('quantityBase', 'Sealed quantity must match pack count and conversion');
      }
    } else if (this.sealedPackCount != null) this.invalidate('sealedPackCount', 'Only sealed packs have a pack count');
  });
  return { User: users, Role: roles, Permission: permissions, Warehouse: warehouses, Location: locations,
    Product: products, Customer: customers, Supplier: suppliers, DeliveryTeam: teams,
    StorageStack: stacks, StorageStackItem: stackItems };
}
