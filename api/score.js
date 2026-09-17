import { db, withSchema, SLUGS, readBody, fail } from './_db.js';

/* Strips control characters and emoji-bombs, keeps letters/digits/space/.'- */
function cleanName(raw) {
  return String(raw || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Use POST.');

  const body = await readBody(req);
  const game = String(body.game || '');
  if (!SLUGS.includes(game)) return fail(res, 400, 'Unknown game.');

  const player = cleanName(body.player);
  if (player.length < 1) return fail(res, 400, 'Enter a name before saving.');

  const maxScore = Math.max(1, Math.min(100000, Math.round(Number(body.maxScore) || 0)));
  const score = Math.max(0, Math.min(maxScore, Math.round(Number(body.score) || 0)));
  const durationMs = Math.max(0, Math.min(3 * 60 * 60 * 1000, Math.round(Number(body.durationMs) || 0)));

  let meta = {};
  if (body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)) {
    const json = JSON.stringify(body.meta);
    if (json.length <= 2000) meta = body.meta;
  }

  try {
    const sql = db();
    const rows = await withSchema(() => sql`
      INSERT INTO scores (game, player, score, max_score, duration_ms, meta)
      VALUES (${game}, ${player}, ${score}, ${maxScore}, ${durationMs}, ${JSON.stringify(meta)}::jsonb)
      RETURNING id, created_at`);

    const rank = await sql`
      SELECT COUNT(*)::int AS better FROM scores
      WHERE game = ${game}
        AND (score > ${score} OR (score = ${score} AND duration_ms < ${durationMs}))`;

    res.status(200).json({ ok: true, id: rows[0].id, rank: rank[0].better + 1 });
  } catch (err) {
    console.error('score insert failed', err);
    fail(res, 500, 'Could not save the score. Check the database connection.');
  }
}
