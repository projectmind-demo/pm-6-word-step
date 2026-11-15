import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { body, db, id, json } from './_db.js';

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;
const cookieName = 'word_step_session';
const cleanEmail = (value) => String(value || '').trim().toLowerCase();
const parseCookies = (value = '') => Object.fromEntries(value.split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key, val]) => key && val));

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
async function checkPassword(password, stored) {
  const [, salt, encoded] = String(stored).split(':');
  if (!salt || !encoded) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(encoded, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
async function currentUser(req) {
  const token = parseCookies(req.headers.cookie).word_step_session;
  if (!token) return null;
  const session = await db.execute({ sql: 'SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at > CURRENT_TIMESTAMP', args: [token] });
  return session.rows[0] || null;
}
function setSession(res, token) {
  res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
}
async function createSession(userId, res) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await db.execute({ sql: 'INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)', args: [token, userId, expires] });
  setSession(res, token);
}
const requireUser = async (req, res) => { const user = await currentUser(req); if (!user) json(res, 401, { error: 'ログインが必要です。' }); return user; };

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
    const method = req.method || 'GET';

    if (route === 'auth/register' && method === 'POST') {
      const input = await body(req); const email = cleanEmail(input.email); const name = String(input.name || '').trim(); const password = String(input.password || '');
      if (!email.includes('@') || !name || password.length < 8) return json(res, 400, { error: '名前、正しいメールアドレス、8文字以上のパスワードを入力してください。' });
      const passwordHash = await hashPassword(password);
      const userId = id();
      try { await db.execute({ sql: 'INSERT INTO users (id,email,name,password_hash) VALUES (?,?,?,?)', args: [userId, email, name, passwordHash] }); } catch { return json(res, 409, { error: 'このメールアドレスはすでに登録されています。' }); }
      await createSession(userId, res); return json(res, 201, { user: { id: userId, email, name } });
    }
    if (route === 'auth/login' && method === 'POST') {
      const input = await body(req); const result = await db.execute({ sql: 'SELECT id,email,name,password_hash FROM users WHERE email=?', args: [cleanEmail(input.email)] }); const user = result.rows[0];
      if (!user || !(await checkPassword(String(input.password || ''), user.password_hash))) return json(res, 401, { error: 'メールアドレスまたはパスワードが正しくありません。' });
      await createSession(user.id, res); return json(res, 200, { user: { id: user.id, email: user.email, name: user.name } });
    }
    if (route === 'auth/logout' && method === 'POST') { const token = parseCookies(req.headers.cookie).word_step_session; if (token) await db.execute({ sql: 'DELETE FROM sessions WHERE id=?', args: [token] }); res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`); return json(res, 200, { ok: true }); }
    if (route === 'me' && method === 'GET') { const user = await requireUser(req, res); if (!user) return; return json(res, 200, { user }); }

    const user = await requireUser(req, res); if (!user) return;
    if (route === 'words' && method === 'GET') { const result = await db.execute({ sql: 'SELECT id,word,meaning,example,created_at FROM words WHERE user_id=? ORDER BY created_at DESC', args: [user.id] }); return json(res, 200, { words: result.rows }); }
    if (route === 'words' && method === 'POST') { const input = await body(req); const word = String(input.word || '').trim(); const meaning = String(input.meaning || '').trim(); const example = String(input.example || '').trim(); if (!word || !meaning) return json(res, 400, { error: '単語と意味を入力してください。' }); const wordId = id(); await db.execute({ sql: 'INSERT INTO words (id,user_id,word,meaning,example) VALUES (?,?,?,?,?)', args: [wordId,user.id,word,meaning,example] }); return json(res, 201, { word: { id: wordId, word, meaning, example } }); }
    if (route.startsWith('words/') && method === 'DELETE') { const wordId = route.split('/')[1]; await db.execute({ sql: 'DELETE FROM words WHERE id=? AND user_id=?', args: [wordId,user.id] }); return json(res, 200, { ok: true }); }
    if (route === 'tests' && method === 'GET') { const result = await db.execute({ sql: 'SELECT id,test_date,score,total,created_at FROM test_results WHERE user_id=? ORDER BY test_date DESC', args: [user.id] }); return json(res, 200, { results: result.rows }); }
    if (route === 'tests' && method === 'POST') { const input = await body(req); const score = Number(input.score); const total = Number(input.total); const testDate = /^\d{4}-\d{2}-\d{2}$/.test(input.testDate || '') ? input.testDate : new Date().toISOString().slice(0,10); if (!Number.isInteger(score) || !Number.isInteger(total) || score < 0 || total < 1 || score > total) return json(res, 400, { error: 'テスト結果が正しくありません。' }); await db.execute({ sql: 'INSERT INTO test_results (id,user_id,test_date,score,total) VALUES (?,?,?,?,?) ON CONFLICT(user_id,test_date) DO UPDATE SET score=excluded.score,total=excluded.total,created_at=CURRENT_TIMESTAMP', args: [id(),user.id,testDate,score,total] }); return json(res, 201, { ok: true }); }
    return json(res, 404, { error: '見つかりません。' });
  } catch (error) { console.error(error); return json(res, 500, { error: 'サーバーでエラーが発生しました。' }); }
}
