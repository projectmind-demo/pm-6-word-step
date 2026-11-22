import { client, fail, sendJson, validateIdentity } from './_lib/data.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'method not allowed');
  const { identity } = req.query ?? {};
  if (!validateIdentity(identity)) return fail(res, 400, 'identity must be dad, mom, or uu');
  try {
    const result = await client.execute({ sql: `SELECT d.study_date AS date, d.checked_in AS checkedIn, d.completed_at AS completedAt, t.total_questions AS totalQuestions, t.correct_answers AS correctAnswers, t.completed_at AS testCompletedAt FROM study_days d LEFT JOIN test_results t ON t.identity = d.identity AND t.study_date = d.study_date WHERE d.identity = ? ORDER BY d.study_date`, args: [identity] });
    const tests = await client.execute({ sql: 'SELECT study_date AS date, total_questions AS totalQuestions, correct_answers AS correctAnswers, completed_at AS completedAt FROM test_results WHERE identity = ? AND study_date NOT IN (SELECT study_date FROM study_days WHERE identity = ?)', args: [identity, identity] });
    const days = [...result.rows, ...tests.rows].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((row) => ({ date: row.date, checkedIn: Boolean(row.checkedIn), completedAt: row.completedAt ?? null, test: row.totalQuestions == null ? null : { totalQuestions: Number(row.totalQuestions), correctAnswers: Number(row.correctAnswers), completedAt: row.testCompletedAt ?? row.completedAt ?? null } }));
    return sendJson(res, 200, { identity, days });
  } catch (error) { return fail(res, 500, 'unable to load progress'); }
}
