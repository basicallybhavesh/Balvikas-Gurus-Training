import { db, ensureSchema, withSchema, verifyToken, SLUGS, readBody, fail } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Use POST.');

  const body = await readBody(req);
  if (!verifyToken(body.token)) return fail(res, 401, 'Session expired. Reload the admin page.');

  const sql = db();
  const action = String(body.action || '');

  try {
    if (action === 'init') {
      await ensureSchema();
      return res.status(200).json({ ok: true });
    }

    if (action === 'stats') {
      const agg = await withSchema(() => sql`
        SELECT game, COUNT(*)::int AS plays, MAX(score)::int AS top, MAX(created_at) AS last
        FROM scores GROUP BY game`);
      const recent = await sql`
        SELECT id, game, player, score, max_score, duration_ms, created_at
        FROM scores ORDER BY created_at DESC LIMIT 25`;

      const stats = {};
      for (const slug of SLUGS) stats[slug] = { plays: 0, top: null, last: null };
      for (const r of agg) stats[r.game] = { plays: r.plays, top: r.top, last: r.last };

      return res.status(200).json({ ok: true, stats, recent });
    }

    if (action === 'clear') {
      const game = String(body.game || '');
      if (!SLUGS.includes(game)) return fail(res, 400, 'Unknown game.');
      const rows = await withSchema(() => sql`DELETE FROM scores WHERE game = ${game} RETURNING id`);
      return res.status(200).json({ ok: true, deleted: rows.length });
    }

    if (action === 'clearAll') {
      const rows = await withSchema(() => sql`DELETE FROM scores RETURNING id`);
      return res.status(200).json({ ok: true, deleted: rows.length });
    }

    if (action === 'delete') {
      const id = Number(body.id);
      if (!Number.isInteger(id) || id < 1) return fail(res, 400, 'Bad entry id.');
      const rows = await withSchema(() => sql`DELETE FROM scores WHERE id = ${id} RETURNING id`);
      return res.status(200).json({ ok: true, deleted: rows.length });
    }

    return fail(res, 400, 'Unknown action.');
  } catch (err) {
    console.error('admin action failed', action, err);
    fail(res, 500, 'Database error: ' + (err.message || 'unknown'));
  }
}
