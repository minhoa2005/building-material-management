import 'dotenv/config';
import mongoose from 'mongoose';
import { PurchaseEvidenceUpload } from '../src/models/legacy/index.js';
import { cleanupPurchaseEvidence } from '../src/modules/po-receiving/purchase-evidence.service.js';
import { reconcilePurchasing } from '../src/modules/po-receiving/purchase-reconciliation.js';

const args = process.argv.slice(2);
if (args.some(a => !['reconcile','cleanup-evidence','--apply'].includes(a)) || !['reconcile','cleanup-evidence'].includes(args[0])) throw new Error('Use reconcile or cleanup-evidence [--apply]');
try {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 5000 });
  if (args[0] === 'reconcile') {
    const session = await mongoose.startSession();
    try {
      const report = await session.withTransaction(() => reconcilePurchasing(session), { readConcern: { level: 'snapshot' } });
      console.info(JSON.stringify(report, null, 2)); if (!report.ok) process.exitCode = 1;
    } finally { await session.endSession(); }
  } else {
    console.info(JSON.stringify(args.includes('--apply') ? await cleanupPurchaseEvidence() : { dryRun: true,
      expired: await PurchaseEvidenceUpload.countDocuments({ status: { $in: ['UPLOADING','READY','DELETING'] }, expiresAt: { $lte: new Date() } }) }));
  }
} finally { await mongoose.disconnect(); }
