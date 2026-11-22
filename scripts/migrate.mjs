import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const client = createClient({
  url: process.env.DATABASE_URL ?? 'file:local.db',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

function statements(sql) {
  return sql.replace(/--[^\n]*/g, '').split(';').map((item) => item.trim()).filter(Boolean);
}

// Older deployments used _migrations with a different schema. Keep that table
// untouched and use a dedicated tracker for this migration format instead.
const migrationTable = '_word_step_migrations';
await client.execute(`CREATE TABLE IF NOT EXISTS ${migrationTable} (filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
const files = (await readdir(join(root, 'db/migrations'))).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
for (const filename of files) {
  const existing = await client.execute({ sql: `SELECT 1 FROM ${migrationTable} WHERE filename = ?`, args: [filename] });
  if (existing.rows.length) continue;
  const sql = await readFile(join(root, 'db/migrations', filename), 'utf8');
  await client.batch([
    ...statements(sql),
    { sql: `INSERT INTO ${migrationTable} (filename, applied_at) VALUES (?, ?)`, args: [filename, new Date().toISOString()] }
  ], 'write');
}
await client.close();
