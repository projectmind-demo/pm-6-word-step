import { fail, getDailyWords, sendJson, validateDate, validateIdentity } from './_lib/data.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'method not allowed');
  const { date, identity } = req.query ?? {};
  if (!validateDate(date)) return fail(res, 400, 'date must be YYYY-MM-DD');
  if (!validateIdentity(identity)) return fail(res, 400, 'identity must be dad, mom, or uu');
  try {
    const words = await getDailyWords(identity, date);
    return sendJson(res, 200, { identity, date, words: words.map((word) => ({ ...word, id: Number(word.id), learned: Boolean(word.learned) })) });
  } catch (error) {
    return fail(res, 500, 'unable to load words');
  }
}
