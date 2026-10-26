import { Warehouse } from '../models/index.js';
import { SEED_WAREHOUSES } from './data/accounts.data.js';

/**
 * Đảm bảo các kho mẫu tồn tại (chỉ insert kho còn thiếu theo `code`).
 * @returns {Promise<Map<string, import('mongoose').Types.ObjectId>>} warehouseCode -> _id
 */
export async function seedWarehouses() {
  const warehouseMap = new Map();

  for (const data of SEED_WAREHOUSES) {
    let warehouse = await Warehouse.findOne({ code: data.code });
    if (!warehouse) {
      warehouse = await Warehouse.create({ ...data, isActive: true });
      console.info(`[Seed] Created warehouse ${data.code}.`);
    }
    warehouseMap.set(data.code, warehouse._id);
  }

  return warehouseMap;
}
