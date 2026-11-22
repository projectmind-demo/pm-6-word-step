import { createClient } from '@libsql/client';

export const client = createClient({
  url: process.env.DATABASE_URL ?? 'file:local.db',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

export const identities = new Set(['dad', 'mom', 'uu']);

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').end(JSON.stringify(body));
}

export function fail(res, status, message) {
  sendJson(res, status, { error: message });
}

export function validateIdentity(value) {
  return typeof value === 'string' && identities.has(value);
}

export function validateDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function requestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return req.body;
}

function hash(value) {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}

export async function getDailyWords(identity, date) {
  const existing = await client.execute({
    sql: 'SELECT dw.position, dw.learned, w.id, w.english, w.japanese, w.chinese, w.phonetic, w.example FROM daily_words dw JOIN words w ON w.id = dw.word_id WHERE dw.identity = ? AND dw.study_date = ? ORDER BY dw.position',
    args: [identity, date]
  });
  if (existing.rows.length === 10) return existing.rows;

  const all = await client.execute('SELECT id, english, japanese, chinese, phonetic, example FROM words');
  if (all.rows.length < 10) throw new Error('word bank contains fewer than 10 words');
  const selected = [...all.rows].sort((a, b) => hash(`${identity}:${date}:${a.id}`) - hash(`${identity}:${date}:${b.id}`)).slice(0, 10);
  await client.batch(
    selected.map((word, index) => ({
      sql: 'INSERT OR IGNORE INTO daily_words (identity, study_date, word_id, position) VALUES (?, ?, ?, ?)',
      args: [identity, date, word.id, index]
    })),
    'write'
  );
  return getDailyWords(identity, date);
}

export function wordJson(row) {
  return { id: Number(row.id), english: row.english, japanese: row.japanese, chinese: row.chinese, phonetic: row.phonetic, example: row.example, learned: Boolean(row.learned) };
}
