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

await client.execute('CREATE TABLE IF NOT EXISTS _migrations (filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
const files = (await readdir(join(root, 'db/migrations'))).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
for (const filename of files) {
  const existing = await client.execute({ sql: 'SELECT 1 FROM _migrations WHERE filename = ?', args: [filename] });
  if (existing.rows.length) continue;
  await client.execute('BEGIN');
  try {
    const sql = await readFile(join(root, 'db/migrations', filename), 'utf8');
    for (const statement of statements(sql)) await client.execute(statement);
    await client.execute({ sql: 'INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)', args: [filename, new Date().toISOString()] });
    await client.execute('COMMIT');
  } catch (error) {
    await client.execute('ROLLBACK');
    throw error;
  }
}
await client.close();
