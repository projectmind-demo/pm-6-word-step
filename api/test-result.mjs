import { client, fail, requestBody, sendJson, validateDate, validateIdentity } from './_lib/data.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'method not allowed');
  const body = requestBody(req);
  if (!body || !validateIdentity(body.identity) || !validateDate(body.date)) return fail(res, 400, 'identity and date are required');
  const totalQuestions = body.totalQuestions ?? body.total;
  const correctAnswers = body.correctAnswers ?? body.correct;
  if (!Number.isInteger(totalQuestions) || !Number.isInteger(correctAnswers) || totalQuestions <= 0 || correctAnswers < 0 || correctAnswers > totalQuestions) return fail(res, 400, 'totalQuestions and correctAnswers are invalid');
  try {
    const completedAt = new Date().toISOString();
    await client.execute({ sql: 'INSERT INTO test_results (identity, study_date, total_questions, correct_answers, completed_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(identity, study_date) DO UPDATE SET total_questions = excluded.total_questions, correct_answers = excluded.correct_answers, completed_at = excluded.completed_at', args: [body.identity, body.date, totalQuestions, correctAnswers, completedAt] });
    return sendJson(res, 200, { identity: body.identity, date: body.date, totalQuestions, correctAnswers, completedAt });
  } catch (error) { return fail(res, 500, 'unable to save test result'); }
}
