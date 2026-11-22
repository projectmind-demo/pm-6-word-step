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

async function tableColumns(table) {
  const result = await client.execute(`PRAGMA table_info("${table}")`);
  return new Set(result.rows.map((row) => String(row.name)));
}

async function preserveLegacyTable(table) {
  const legacyName = `${table}_legacy_${Date.now()}`;
  await client.execute(`ALTER TABLE "${table}" RENAME TO "${legacyName}"`);
  return legacyName;
}

// The first version of this app used different columns for these tables and
// recorded the migration in the old _migrations table. Keep those records,
// but move the incompatible tables aside so the current schema can be created.
// This also makes upgrades work when _word_step_migrations already says that
// 001_initial.sql was applied.
const requiredColumns = {
  words: ['english', 'japanese', 'chinese', 'phonetic', 'example'],
  test_results: ['identity', 'study_date', 'total_questions', 'correct_answers', 'completed_at']
};
let schemaNeedsBaseline = false;
for (const [table, required] of Object.entries(requiredColumns)) {
  const columns = await tableColumns(table);
  if (columns.size > 0 && required.some((column) => !columns.has(column))) {
    const legacyName = await preserveLegacyTable(table);
    console.log(`Preserved legacy ${table} table as ${legacyName}`);
    schemaNeedsBaseline = true;
  }
}
if (schemaNeedsBaseline) {
  await client.execute({ sql: `DELETE FROM ${migrationTable} WHERE filename = ?`, args: ['001_initial.sql'] });
}

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
