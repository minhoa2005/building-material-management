/**
 * Module & CLI Seed Dữ liệu GoodsReceipt (WMSD)
 *
 * Chạy độc lập hoặc tích hợp trong quy trình seed toàn hệ thống:
 *   node be/src/seeds/goods-receipt.seed.js
 *   node be/src/seeds/goods-receipt.seed.js --force
 *
 * Đảm bảo:
 *  - Tự động kiểm tra trạng thái dữ liệu của database / collection goods_receipts.
 *  - Nếu chưa có dữ liệu: Tự động khởi tạo toàn bộ 5 loại phiếu nhập kho:
 *      1. PURCHASE (Mua hàng PO / Kiểm nhận)
 *      2. CUSTOMER_RETURN (Khách trả hàng)
 *      3. FAILED_DELIVERY (Giao thất bại & mở lại nhu cầu)
 *      4. TRANSFER (Điều chuyển liên kho)
 *      5. OTHER (Nhập khác / thủ công & 4 tình huống sửa sai)
 *  - Nếu đã có dữ liệu: Bỏ qua (trừ khi dùng cờ --force).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { registerModels } from '../models/registry.js';
import { buildReviewedDemo } from './rebuild/data.js';
import { enrichGoodsReceiptsSeedData } from './data/goods-receipts.data.js';

/**
 * Kiểm tra xem collection goods_receipts đã có dữ liệu hay chưa.
 *
 * @param {mongoose.mongo.Db} db
 * @returns {Promise<boolean>}
 */
export async function goodsReceiptsHaveData(db) {
  const collectionNames = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
  if (!collectionNames.includes('goods_receipts')) {
    return false;
  }
  const count = await db.collection('goods_receipts').countDocuments({}, { limit: 1 });
  return count > 0;
}

/**
 * Khởi tạo dữ liệu mẫu cho GoodsReceipt khi chưa có dữ liệu.
 *
 * @param {Object} options
 * @param {mongoose.Connection} [options.connection] - Kết nối mongoose đang dùng
 * @param {boolean} [options.force=false] - Xóa và ghi đè nếu đã tồn tại
 * @returns {Promise<{ seeded: boolean, reason?: string, count?: number }>}
 */
export async function seedGoodsReceipts({ connection = mongoose.connection, force = false } = {}) {
  if (connection.readyState !== 1) {
    throw new Error('Seed GoodsReceipt yêu cầu một kết nối MongoDB đang hoạt động.');
  }

  const db = connection.db;
  const hasData = await goodsReceiptsHaveData(db);

  if (hasData && !force) {
    console.info('[Seed GoodsReceipt] Skipped: Collection goods_receipts đã có dữ liệu.');
    return { seeded: false, reason: 'GOODS_RECEIPTS_NOT_EMPTY' };
  }

  console.info('[Seed GoodsReceipt] Bắt đầu khởi tạo dữ liệu mẫu cho 5 loại phiếu GoodsReceipt...');

  // Đăng ký models trên connection hiện tại
  const modelMap = registerModels(connection);
  const GoodsReceiptModel = modelMap.get('goods_receipts');

  // Lấy bộ dữ liệu nền và làm giàu danh mục goods_receipts
  const demoData = await buildReviewedDemo();
  enrichGoodsReceiptsSeedData(demoData);

  const receipts = demoData.goods_receipts;

  // Khởi tạo các mongoose documents và xác thực tính hợp lệ theo schema/discriminator
  const documents = receipts.map((row) => new GoodsReceiptModel(row));
  for (const doc of documents) {
    await doc.validate();
  }

  // Tạo collection và indexes
  await GoodsReceiptModel.createCollection();
  await GoodsReceiptModel.createIndexes();

  // Đảm bảo các collection liên đới phụ thuộc (attachments, approval_history) cũng được tạo
  for (const related of ['attachments', 'approval_history']) {
    const RelatedModel = modelMap.get(related);
    if (RelatedModel) {
      await RelatedModel.createCollection();
      await RelatedModel.createIndexes();
      const existingCount = await db.collection(related).countDocuments({}, { limit: 1 });
      if (existingCount === 0 && demoData[related]?.length) {
        await RelatedModel.insertMany(demoData[related], { ordered: false }).catch(() => {});
      }
    }
  }

  if (force) {
    await db.collection('goods_receipts').deleteMany({});
  }

  // Thực hiện ghi dữ liệu
  await GoodsReceiptModel.insertMany(
    documents.map((d) => d.toObject()),
    { ordered: true },
  );

  console.info(`[Seed GoodsReceipt] Khởi tạo thành công ${documents.length} phiếu GoodsReceipt (đủ 5 loại chứng từ).`);
  return { seeded: true, count: documents.length };
}

// Chạy trực tiếp qua CLI: node be/src/seeds/goods-receipt.seed.js [--force]
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  async function cli() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI chưa được cấu hình trong biến môi trường.');
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.info('Connected to MongoDB.');

    const force = process.argv.includes('--force');
    await seedGoodsReceipts({ force });
  }

  cli()
    .catch((error) => {
      console.error('[Seed GoodsReceipt] Thất bại:', error);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
