/**
 * Module Seed Dữ liệu Khởi động Database (WMSD)
 *
 * Tuân thủ quy chuẩn phân quyền theo tài liệu dự án:
 *  - de_xuat_quy_trinh_2_VI.md §3 (Actors và nguyên tắc phân quyền) & §6 (Permission matrix nghiệp vụ).
 *  - de_xuat_database_design_VI.md §Single-role authorization (5 vai trò: OWNER, SALES, WAREHOUSE, ACCOUNTANT, ADMIN).
 *  - NATIVE_MODEL_RUNTIME.md & ITERATION1_NATIVE_2026-11-06.md (60 collection models nghiệp vụ).
 *
 * Cơ chế:
 *  - Kiểm tra xem DB đã có dữ liệu chưa qua databaseHasData(db).
 *  - Nếu đã có dữ liệu: Bỏ qua (không ghi đè hoặc insert trùng).
 *  - Nếu DB trống: Tự động khởi tạo toàn bộ 60 collections, indexes và insert dữ liệu chuẩn.
 *  - Hỗ trợ cả MongoDB standalone và Replica Set/Atlas.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { registerModels } from '../models/registry.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS, ROLE } from './data/permissions.data.js';
import { SEED_ACCOUNTS, SEED_WAREHOUSES } from './data/accounts.data.js';
import { buildReviewedDemo, fixtureId, demoDate } from './rebuild/data.js';

/**
 * Kiểm tra xem cơ sở dữ liệu đã có dữ liệu hay chưa.
 * Quét qua các collections (loại trừ system collections) xem có bất kỳ document nào không.
 */
export async function databaseHasData(db, { collectionNames, session } = {}) {
  const names = collectionNames ?? (await db.listCollections({}, { nameOnly: true }).toArray())
    .map(({ name }) => name)
    .filter((name) => !name.startsWith('system.'));

  for (const name of names) {
    const hasDoc = await db.collection(name).findOne({}, { projection: { _id: 1 }, ...(session ? { session } : {}) });
    if (hasDoc) {
      return true;
    }
  }
  return false;
}

/**
 * Xây dựng toàn bộ dữ liệu mẫu chuẩn cho 60 models của hệ thống,
 * đảm bảo chuẩn phân quyền, tài khoản mẫu và master data.
 */
export async function buildCompleteSeedData(connection = mongoose.connection) {
  const modelMap = registerModels(connection);
  const data = await buildReviewedDemo();

  // Ánh xạ vai trò và kho cho danh sách tài khoản chuẩn SEED_ACCOUNTS
  const roleMap = new Map(data.roles.map((r) => [r.code, r._id]));
  const whMap = new Map();
  data.warehouses.forEach((w, idx) => {
    whMap.set(SEED_WAREHOUSES[idx]?.code || (`WH0${idx + 1}`), w._id);
    if (w.code) whMap.set(w.code, w._id);
  });

  const existingUsernames = new Set(data.users.map((u) => u.username));
  for (const acc of SEED_ACCOUNTS) {
    if (!existingUsernames.has(acc.username)) {
      const roleId = roleMap.get(acc.roleCode);
      const warehouseIds = (acc.warehouseCodes || []).map((code) => whMap.get(code)).filter(Boolean);
      data.users.push({
        _id: fixtureId(`seed-account:${acc.username}`),
        username: acc.username,
        fullName: acc.fullName,
        passwordHash: bcrypt.hashSync(acc.password, 10),
        roleId,
        warehouseIds,
        phone: acc.phone,
        email: acc.username,
        isActive: true,
        version: 1,
        createdAt: demoDate(1),
        updatedAt: demoDate(1),
      });
      existingUsernames.add(acc.username);
    }
  }

  // Khởi tạo các Mongoose documents và xác thực schema cho từng collection
  const groups = [...modelMap].map(([name, Model]) => ({
    name,
    Model,
    documents: (data[name] || []).map((row) => new Model(row)),
  }));

  for (const { name, documents } of groups) {
    for (const doc of documents) {
      await doc.validate();
    }
  }

  return { data, groups, modelMap };
}

/**
 * Cập nhật quyền cho các vai trò hiện có mà không insert dữ liệu mới.
 */
export async function syncExistingRolePermissions() {
  const Permission = mongoose.connection.model('Permission');
  const Role = mongoose.connection.model('Role');
  const permissions = await Permission.find({}).lean();
  const permissionMap = new Map(permissions.map(({ code, _id }) => [code, _id]));
  const roles = await Role.find({ code: { $in: Object.keys(ROLE_PERMISSIONS) } });

  for (const role of roles) {
    for (const code of ROLE_PERMISSIONS[role.code]) {
      if (!permissionMap.has(code)) {
        throw new Error(`Cannot sync roles: missing permission ${code}.`);
      }
    }
  }

  for (const role of roles) {
    role.permissionIds = ROLE_PERMISSIONS[role.code].map((code) => permissionMap.get(code));
    await role.save();
  }
  console.info(`[Seed] Synced permissions for ${roles.length} existing role(s); no records inserted.`);
  return { seeded: false, syncedRoles: roles.length };
}

/**
 * Cấp quyền xem mua hàng cho vai trò OWNER và ACCOUNTANT nếu chưa có.
 */
export async function grantPurchaseReadPermissions() {
  const Permission = mongoose.connection.model('Permission');
  const Role = mongoose.connection.model('Role');
  const codes = ['purchase_order:read', 'goods_receipt_inspection:read', 'putaway_task:read'];
  const permissions = await Permission.find({ code: { $in: codes } }).lean();

  for (const code of codes) {
    if (!permissions.some((p) => p.code === code)) {
      throw new Error(`Cannot grant purchase read permissions: missing permission ${code}.`);
    }
  }
  const permissionIds = permissions.map((p) => p._id);
  const result = await Role.updateMany(
    { code: { $in: ['OWNER', 'ACCOUNTANT'] }, permissionIds: { $not: { $all: permissionIds } } },
    { $addToSet: { permissionIds: { $each: permissionIds } } },
  );
  console.info(`[Seed] Granted purchase viewing to ${result.modifiedCount} of ${result.matchedCount} existing role(s).`);
  return { matchedRoles: result.matchedCount, updatedRoles: result.modifiedCount };
}

/**
 * Hàm kiểm tra và seed dữ liệu nếu database chưa có dữ liệu.
 * Chạy khi khởi động database / server.
 *
 * @param {Object} options
 * @param {mongoose.Connection} [options.connection] - Connection mongoose đang dùng
 * @param {boolean} [options.syncRolePermissions=false] - Nếu có dữ liệu thì có đồng bộ quyền không
 * @returns {Promise<{ seeded: boolean, reason?: string, counts?: Record<string, number> }>}
 */
export async function seedDatabaseIfEmpty({
  connection = mongoose.connection,
  syncRolePermissions = false,
} = {}) {
  if (connection.readyState !== 1) {
    throw new Error('Seeding requires an active MongoDB connection.');
  }

  const db = connection.db;

  // Bước 1: Kiểm tra xem DB đã có dữ liệu chưa
  const hasData = await databaseHasData(db);
  if (hasData) {
    if (syncRolePermissions) {
      return syncExistingRolePermissions();
    }
    console.info('[Seed] Skipped: Cơ sở dữ liệu đã có dữ liệu. Không thực hiện seed lại.');
    return { seeded: false, reason: 'DATABASE_NOT_EMPTY' };
  }

  console.info('[Seed] Cơ sở dữ liệu chưa có dữ liệu. Bắt đầu khởi tạo dữ liệu mẫu với phân quyền chuẩn...');

  // Bước 2: Chuẩn bị dữ liệu và đăng ký 60 models
  const { groups } = await buildCompleteSeedData(connection);

  // Bước 3: Tạo collections và indexes trước khi insert
  for (const { Model } of groups) {
    await Model.createCollection();
    await Model.createIndexes();
  }

  const collectionNames = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map(({ name }) => name)
    .filter((name) => !name.startsWith('system.'));

  // Bước 4: Kiểm tra hỗ trợ transaction (Replica Set / Atlas) vs Standalone MongoDB
  let hello = {};
  try {
    hello = await db.admin().command({ hello: 1 });
  } catch (_err) {
    // Không có quyền admin command hoặc standalone
  }
  const supportsTransactions = Boolean(hello.setName || hello.msg === 'isdbgrid');

  if (supportsTransactions) {
    const session = await connection.startSession();
    try {
      let seeded = false;
      await session.withTransaction(
        async () => {
          seeded = false;
          if (await databaseHasData(db, { collectionNames, session })) {
            return;
          }
          for (const { Model, documents } of groups) {
            if (documents.length) {
              await Model.insertMany(
                documents.map((d) => d.toObject()),
                { session, ordered: true },
              );
            }
          }
          seeded = true;
        },
        { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } },
      );

      const counts = seeded
        ? Object.fromEntries(groups.map(({ Model, documents }) => [Model.modelName, documents.length]))
        : {};
      console.info(
        seeded
          ? `[Seed] Khởi tạo thành công toàn bộ dữ liệu mẫu (${Object.keys(counts).length} collections) qua Transaction.`
          : '[Seed] Skipped: database already contains data.',
      );
      return { seeded, ...(seeded ? { counts } : { reason: 'DATABASE_NOT_EMPTY' }) };
    } finally {
      await session.endSession();
    }
  } else {
    // Standalone MongoDB (môi trường local dev thông thường)
    if (await databaseHasData(db, { collectionNames })) {
      console.info('[Seed] Skipped: database already contains data.');
      return { seeded: false, reason: 'DATABASE_NOT_EMPTY' };
    }

    for (const { Model, documents } of groups) {
      if (documents.length) {
        await Model.insertMany(
          documents.map((d) => d.toObject()),
          { ordered: true },
        );
      }
    }

    const counts = Object.fromEntries(groups.map(({ Model, documents }) => [Model.modelName, documents.length]));
    console.info(`[Seed] Khởi tạo thành công toàn bộ dữ liệu mẫu (${Object.keys(counts).length} collections) trên Standalone MongoDB.`);
    return { seeded: true, counts };
  }
}

export const runSeeds = seedDatabaseIfEmpty;
export const seedRolesAndUsers = seedDatabaseIfEmpty;

// Hỗ trợ chạy trực tiếp qua CLI: node src/seeds/seed.js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  async function cli() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not set.');
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.info('Connected to MongoDB.');

    if (process.argv.includes('--purchase-read-only')) {
      await grantPurchaseReadPermissions();
      return;
    }

    const syncRolePermissions =
      process.argv.includes('--sync-permissions') || process.env.SEED_SYNC_ROLE_PERMISSIONS === 'true';

    await seedDatabaseIfEmpty({ syncRolePermissions });
  }

  cli()
    .catch((error) => {
      console.error('[Seed] Failed:', error);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
