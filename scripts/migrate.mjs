import { readdir, readFile } from 'node:fs/promises';
import { createClient } from '@libsql/client';

const db = createClient({ url: process.env.DATABASE_URL ?? 'file:local.db', authToken: process.env.DATABASE_AUTH_TOKEN });
await db.execute('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
const files = (await readdir(new URL('../db/migrations/', import.meta.url)))
  .filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
for (const name of files) {
  const found = await db.execute({ sql: 'SELECT name FROM _migrations WHERE name = ?', args: [name] });
  if (found.rows.length) continue;
  const sql = await readFile(new URL(`../db/migrations/${name}`, import.meta.url), 'utf8');
  await db.batch(sql.split(';').map((statement) => statement.trim()).filter(Boolean).map((statement) => ({ sql: statement, args: [] })), 'write');
  await db.execute({ sql: 'INSERT INTO _migrations (name) VALUES (?)', args: [name] });
  console.log(`Applied ${name}`);
}
console.log('Database migrations are up to date.');
