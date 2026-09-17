import { db, withSchema, SLUGS, fail } from './_db.js';

export default async function handler(req, res) {
  const game = String(req.query.game || '');
  if (!SLUGS.includes(game)) return fail(res, 400, 'Unknown game.');

  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 25));

  try {
    const sql = db();
    const rows = await withSchema(() => sql`
      SELECT player, score, max_score, duration_ms, created_at,
             COUNT(*) OVER()::int AS plays
      FROM scores
      WHERE game = ${game}
      ORDER BY score DESC, duration_ms ASC, created_at ASC
      LIMIT ${limit}`);

    res.status(200).json({
      ok: true,
      game,
      plays: rows.length ? rows[0].plays : 0,
      fetchedAt: new Date().toISOString(),
      rows: rows.map((r, i) => ({
        rank: i + 1,
        player: r.player,
        score: r.score,
        maxScore: r.max_score,
        durationMs: r.duration_ms,
        createdAt: r.created_at
      }))
    });
  } catch (err) {
    console.error('leaderboard read failed', err);
    fail(res, 500, 'Could not load the leaderboard.');
  }
}
