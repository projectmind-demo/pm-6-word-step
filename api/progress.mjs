import { client, fail, sendJson, validateIdentity } from './_lib/data.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'method not allowed');
  const { identity } = req.query ?? {};
  if (!validateIdentity(identity)) return fail(res, 400, 'identity must be dad, mom, or uu');
  try {
    const tests = await client.execute({ sql: 'SELECT study_date AS date, total_questions AS totalQuestions, correct_answers AS correctAnswers, completed_at AS completedAt FROM test_results WHERE identity = ? ORDER BY study_date', args: [identity] });
    const testDates = tests.rows.map((row) => String(row.date));
    const days = tests.rows.map((row) => ({ date: row.date, checkedIn: false, completedAt: null, test: { totalQuestions: Number(row.totalQuestions), correctAnswers: Number(row.correctAnswers), completedAt: row.completedAt } }));
    return sendJson(res, 200, { identity, testDates, days });
  } catch (error) { return fail(res, 500, 'unable to load progress'); }
}
