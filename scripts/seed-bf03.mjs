import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { registerModels } from '../src/models/index.js';
import { requireLoopbackMongoUri } from '../src/config/local-mongo.js';

// Additive fixture: never resets stock or modifies an existing catalogue record.
export async function seedBF03(connection, { warehouseCode, apply = false }) {
  const models = registerModels(connection);
  const model = name => models.get(name);
  const warehouse = await model('warehouses').findOne({ code: warehouseCode, isActive: true });
  if (!warehouse) throw new Error('Active warehouse not found: ' + warehouseCode);
  const key = 'bf03-demo-v1:' + warehouse._id;
  const id = name => new mongoose.Types.ObjectId(createHash('sha256').update(key + ':' + name).digest('hex').slice(0, 24));
  const number = 'BF03-OPENING-' + warehouseCode;
  const existing = await model('opening_stocks').findOne({ documentNo: number });
  if (existing) {
    if (String(existing._id) !== String(id('opening'))) throw new Error('Opening code already belongs to another record');
    const balance = await model('inventory_balances').findById(id('balance'));
    return { status: 'ALREADY_SEEDED', database: connection.name, warehouse: warehouseCode,
      source: 'BF03-A', destination: 'BF03-B', sku: 'BF03-DEMO-6060', currentSourceQty: String(balance?.quantityBase ?? 'missing'),
      note: 'Rerun preserves the stock remaining after user operations.' };
  }
  const role = await model('roles').findOne({ code: 'WAREHOUSE', isActive: true });
  const worker = role && await model('users').findOne({ roleId: role._id, warehouseIds: warehouse._id, isActive: true });
  if (!worker) throw new Error('No active Warehouse Staff assigned to this warehouse');
  const ownerRole = await model('roles').findOne({ code: 'OWNER', isActive: true });
  const owner = ownerRole && await model('users').findOne({ roleId: ownerRole._id, isActive: true });
  if (!owner) throw new Error('No active Owner to identify demo opening verification');
  const category = await model('categories').findOne({ isActive: true });
  const categoryId = category?._id ?? id('category');
  const now = new Date();
  const pieceUnit = await model('uoms').findOne({ code: 'Viên' });
  const boxUnit = await model('uoms').findOne({ code: 'Thùng' });
  if (pieceUnit?.isActive === false || (boxUnit && (!boxUnit.isActive || !boxUnit.isCarton))) {
    throw new Error('Đơn vị Viên và Thùng phải đang hoạt động, và Thùng phải được đánh dấu là đơn vị thùng.');
  }
  const boxUnitId = boxUnit?._id ?? id('uom-box');
  const packaging = { packageUnit: 'Thùng', baseUnitsPerPackage: '4', outerLengthMm: '620', outerWidthMm: '620', outerHeightMm: '50' };
  const location = (suffix, name) => ({ _id: id(suffix), warehouseId: warehouse._id, code: name,
    name: 'Vị trí mẫu BF03 ' + name, locationType: 'STORAGE', isPickable: true, isActive: true,
    usableLengthMm: '2500', usableWidthMm: '2500', version: 1, operationVersion: 0 });
  const records = {
    uoms: [
      ...(!pieceUnit ? [{ _id: id('uom-piece'), code: 'Viên', name: 'Viên', isActive: true }] : []),
      ...(!boxUnit ? [{ _id: boxUnitId, code: 'Thùng', name: 'Thùng', isCarton: true, isActive: true }] : []),
    ],
    conversions: [{ _id: id('conversion-box'), productId: id('product'), productBatchId: id('batch'), uomId: boxUnitId, basePerUnit: '4', version: 1, validFrom: now, verificationReference: 'BF03 synthetic verified carton fixture', createdBy: owner._id }],
    ...(!category && { categories: [{ _id: categoryId, code: 'BF03-DEMO', name: 'Gạch mẫu BF03', isActive: true }] }),
    products: [{ _id: id('product'), categoryId, manufacturerCode: 'WMSD-DEMO', sku: 'BF03-DEMO-6060',
      name: 'Gạch mẫu chuyển vị trí BF03 60×60', color: 'Trắng mẫu BF03', baseUnit: 'Viên', wholeBaseUnits: true,
      lengthMm: '600', widthMm: '600', heightMm: '10', isActive: true }],
    product_batches: [{ _id: id('batch'), productId: id('product'), manufacturerLot: 'BF03-DEMO-LOT-01',
      identificationStatus: 'VERIFIED', piecesPerCarton: 4, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50' }],
    warehouse_locations: [location('source', 'BF03-A'), location('destination', 'BF03-B')],
    stock_holding_points: [{ _id: id('source-point'), type: 'LOCATION', locationId: id('source') },
      { _id: id('destination-point'), type: 'LOCATION', locationId: id('destination') }],
    inventory_balances: [{ _id: id('balance'), holdingPointId: id('source-point'), batchId: id('batch'),
      qualityStatus: 'GOOD', ownerType: 'STORE', ownerId: null, quantityBase: '40', version: 0,
      packagingPortions: [{ _id: id('portion'), packagingState: 'SEALED', sealedPackCount: 10,
        quantityBase: '40', packagingSnapshot: packaging, createdBy: worker._id }] }],
    opening_stocks: [{ _id: id('opening'), documentNo: number, documentKind: 'OPENING', workflowStatus: 'POSTED',
      version: 1, createdBy: worker._id, occurredAt: now, postedBy: owner._id, postedAt: now, stockTransactionId: id('posting'),
      note: 'Dữ liệu mẫu BF03 được nạp chủ động; không phải giao dịch thật.',
      header: { warehouseId: warehouse._id, cutoverKey: key, openingAt: now, coveredLocationIds: [id('source')],
        preparedBy: worker._id, preparedAt: now, verifiedBy: owner._id, verifiedAt: now, verifiedVersion: 1 },
      items: [{ _id: id('item'), lineNo: 1, lineKind: 'STANDARD', productId: id('product'), lotId: id('batch'),
        productNameSnapshot: 'Gạch mẫu chuyển vị trí BF03 60×60', enteredUnit: 'Thùng', baseUnitSnapshot: 'Viên',
        baseUnitsPerUnit: '4', enteredQty: '10', qtyBase: '40', packagingSnapshot: packaging,
        locationId: id('source'), ownerType: 'STORE', qualityStatus: 'GOOD' }] }],
    stock_transactions: [{ _id: id('posting'), sourceType: 'opening_stocks', sourceId: id('opening'), operation: 'OPENING',
      eventKey: key, requestKey: key, requestHash: createHash('sha256').update(key).digest('hex'),
      performedBy: owner._id, occurredAt: now, recordedAt: now,
      movements: [{ _id: id('movement'), transactionId: id('posting'), lineNo: 1, sourceLineId: id('item'),
        toBalanceId: id('balance'), quantityBase: '40', toBefore: '0', toAfter: '40' }] }],
  };
  const groups = Object.entries(records).map(([name, rows]) => ({ Model: model(name), documents: rows.map(row => new (model(name))(row)) }));
  for (const group of groups) for (const doc of group.documents) await doc.validate();
  // Refuse collisions, including a partially loaded seed. Never overwrite them.
  for (const [name, rows] of Object.entries(records)) for (const row of rows) {
    if (await model(name).exists({ _id: row._id })) throw new Error('Fixture collision in ' + name);
  }
  for (const code of ['BF03-A', 'BF03-B']) if (await model('warehouse_locations').exists({ warehouseId: warehouse._id, code })) throw new Error('Location code collision: ' + code);
  const report = { status: apply ? 'SEEDED' : 'PREVIEW', database: connection.name, warehouse: warehouseCode,
    username: worker.username, source: 'BF03-A', destination: 'BF03-B', sku: 'BF03-DEMO-6060',
    lot: 'BF03-DEMO-LOT-01', boxes: 10, piecesPerBox: 4, quantityBase: '40',
    records: Object.fromEntries(Object.entries(records).map(([name, rows]) => [name, rows.length])) };
  if (!apply) return report;
  const hello = await connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') throw new Error('Replica set required; nothing inserted');
  const session = await connection.startSession();
  try {
    await session.withTransaction(async () => {
      for (const { Model, documents } of groups) await Model.insertMany(documents.map(d => d.toObject()), { session, ordered: true });
    });
  } finally { await session.endSession(); }
  return report;
}

async function main() {
  await import('dotenv/config');
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i++) {
    if (['--apply', '--allow-remote'].includes(args[i])) options[args[i]] = true;
    else if (['--database', '--warehouse'].includes(args[i]) && args[i + 1]) options[args[i]] = args[++i];
    else throw new Error('Unknown/incomplete seed argument');
  }
  if (!options['--database'] || !options['--warehouse']) throw new Error('Specify --database and --warehouse explicitly');
  if (options['--apply'] && !options['--allow-remote']) requireLoopbackMongoUri(process.env.MONGODB_URI);
  const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
    dbName: options['--database'], autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 8000,
  }).asPromise();
  try { console.log(JSON.stringify(await seedBF03(connection, { warehouseCode: options['--warehouse'], apply: Boolean(options['--apply']) }), null, 2)); }
  finally { await connection.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  console.error('BF03 seed failed:', error.name, error.code ?? '', error.message); process.exitCode = 1;
});
