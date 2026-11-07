import { assertLocalMongoUri, syncSeedPasswords } from '../../scripts/migrate-seed-passwords.mjs';

export async function syncPasswordsOnStartup(connection, { uri, nodeEnv } = {}) {
  if (nodeEnv === 'production' || connection.readyState !== 1) return { skipped: true };
  try { assertLocalMongoUri(uri); } catch { return { skipped: true }; }
  const accounts = await syncSeedPasswords(connection.db.collection('users'), { apply: true });
  return { skipped: false, accounts };
}
