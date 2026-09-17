import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';

/* ------------------------------------------------------------------ *
 * The one list of games the server will accept scores for.
 * Adding a game?  Add its slug here AND create /<slug>/index.html.
 * ------------------------------------------------------------------ */
export const GAMES = [
  { slug: 'pic-values',  title: 'One Pic, Many Values' },
  { slug: 'matching',    title: 'Shrines and Locations' },
  { slug: 'unscramble',  title: 'Unscramble the Hidden Word' },
  { slug: 'who-said-it', title: 'Who Said It?' },
  { slug: 'guess-who',   title: 'Guess Who?' },
  { slug: 'count-faces', title: 'Count the Happy Faces' },
  { slug: 'identify',    title: 'Identify the Character' }
];

export const SLUGS = GAMES.map(g => g.slug);

let _sql = null;
export function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables.');
    _sql = neon(url);
  }
  return _sql;
}

/* Creates the table if it isn't there yet. Safe to call repeatedly. */
export async function ensureSchema() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id          BIGSERIAL PRIMARY KEY,
      game        TEXT        NOT NULL,
      player      TEXT        NOT NULL,
      score       INTEGER     NOT NULL,
      max_score   INTEGER     NOT NULL,
      duration_ms INTEGER     NOT NULL,
      meta        JSONB       NOT NULL DEFAULT '{}'::jsonb,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS scores_board_idx ON scores (game, score DESC, duration_ms ASC)`;
  await sql`CREATE INDEX IF NOT EXISTS scores_recent_idx ON scores (created_at DESC)`;
  return true;
}

/* Runs a query; if the table is missing (42P01) builds it once and retries. */
export async function withSchema(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err && (err.code === '42P01' || /relation "scores" does not exist/i.test(err.message || ''))) {
      await ensureSchema();
      return await fn();
    }
    throw err;
  }
}

/* ---------------------------- admin auth --------------------------- */

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'QWERTY@100';
}

export function checkBasicAuth(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded = '';
  try { decoded = Buffer.from(header.slice(6), 'base64').toString('utf8'); } catch { return false; }
  const pass = decoded.slice(decoded.indexOf(':') + 1);
  const a = Buffer.from(pass);
  const b = Buffer.from(adminPassword());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* Short-lived signed token so the admin page can call the action endpoint
   without the browser having to re-send Basic credentials cross-path. */
export function mintToken(minutes = 120) {
  const exp = Date.now() + minutes * 60 * 1000;
  const sig = crypto.createHmac('sha256', adminPassword()).update(String(exp)).digest('hex').slice(0, 32);
  return `${exp}.${sig}`;
}

export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [expRaw, sig] = token.split('.');
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const want = crypto.createHmac('sha256', adminPassword()).update(String(exp)).digest('hex').slice(0, 32);
  if (!sig || sig.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
}

/* ----------------------------- helpers ----------------------------- */

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

export function fail(res, code, message) {
  res.status(code).json({ ok: false, error: message });
}
