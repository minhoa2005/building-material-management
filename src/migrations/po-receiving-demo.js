import { runSeeds } from '../seeds/index.js';
import { buildDemoData } from '../seeds/data/demo.data.js';

// This is an explicitly destructive development-data reset, not a production
// conversion of existing receipts. The backup must complete before dropDatabase.
export async function resetPoReceivingDemo(connection, { apply = false, targetDatabase, backup } = {}) {
  const name = connection.name;
  if (name !== targetDatabase || !(name === 'sep490' || /^sep490_po_reset_test_[a-f\d]{24}$/.test(name))) {
    throw new Error('Refusing reset: exact approved local demo database must be specified.');
  }
  const hello = await connection.db.admin().command({hello:1});
  if (!hello.setName) throw new Error('Demo reset requires a local replica set.');
  const groups = await buildDemoData();
  for (const {documents} of groups) for (const doc of documents) await doc.validate();
  const counts = Object.fromEntries(groups.map(({Model,documents})=>[Model.modelName,documents.length]));
  if (!apply) return {database:name,dryRun:true,counts};
  if (typeof backup !== 'function') throw new Error('Completed backup required before reset.');
  const saved = await backup(connection);
  if (saved?.completed !== true || !saved.manifestPath) throw new Error('Backup was not completed; no data changed.');
  await connection.dropDatabase();
  const result = await runSeeds();
  if (!result.seeded) throw new Error(`Reset seed did not complete; restore backup ${saved.manifestPath}`);
  return {database:name,dryRun:false,backupManifest:saved.manifestPath,...result};
}
