import { checkBasicAuth, mintToken, GAMES } from './_db.js';

export default function handler(req, res) {
  if (!checkBasicAuth(req)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Games admin", charset="UTF-8"');
    res.status(401).send('Authentication required.');
    return;
  }

  const token = mintToken(120);
  const gamesJson = JSON.stringify(GAMES);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Games admin</title>
<style>
  :root{--ink:#241a12;--soft:#6d5b4a;--line:#e3d5bf;--paper:#fffaf1;--saffron:#d75b16;--peacock:#0e6d75;--rose:#b23a6b}
  *{box-sizing:border-box}
  body{margin:0;background:#f3ead8;color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  .wrap{max-width:900px;margin:0 auto;padding:24px 18px 64px}
  h1{font-size:1.5rem;margin:0 0 4px}
  .sub{color:var(--soft);margin:0 0 22px}
  .panel{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:18px}
  .panel h2{font-size:1rem;margin:0 0 12px}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:9px 8px;border-bottom:1px solid var(--line);font-size:.9rem;vertical-align:middle}
  th{font-weight:600;color:var(--soft)}
  td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
  button{font:inherit;cursor:pointer;border-radius:9px;border:1px solid var(--line);background:#fff;padding:7px 12px}
  button:hover{border-color:var(--soft)}
  button:disabled{opacity:.45;cursor:default}
  .danger{background:var(--rose);border-color:var(--rose);color:#fff}
  .go{background:var(--peacock);border-color:var(--peacock);color:#fff}
  .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  #msg{min-height:22px;font-size:.9rem;color:var(--peacock);margin-top:10px}
  #msg.bad{color:var(--rose)}
  .muted{color:var(--soft);font-size:.85rem}
  code{background:#f0e6d3;padding:1px 5px;border-radius:4px}
  @media(max-width:560px){th:nth-child(3),td:nth-child(3){display:none}}
</style></head>
<body><div class="wrap">
  <h1>Games admin</h1>
  <p class="sub">Leaderboards for every game live in one Neon table. Clearing is permanent.</p>

  <div class="panel">
    <h2>Database</h2>
    <div class="row">
      <button class="go" id="initBtn">Set up tables</button>
      <button id="refreshBtn">Refresh counts</button>
      <button class="danger" id="wipeBtn">Clear every leaderboard</button>
    </div>
    <p class="muted" style="margin:10px 0 0">Run “Set up tables” once after connecting Neon. It is safe to run again — nothing is deleted.</p>
    <div id="msg"></div>
  </div>

  <div class="panel">
    <h2>Leaderboards</h2>
    <table><thead><tr>
      <th>Game</th><th class="num">Entries</th><th class="num">Top score</th><th class="num">Last played</th><th></th>
    </tr></thead><tbody id="statsBody">
      <tr><td colspan="5" class="muted">Loading…</td></tr>
    </tbody></table>
  </div>

  <div class="panel">
    <h2>Latest 25 entries</h2>
    <p class="muted" style="margin:-6px 0 12px">Use this to remove a single silly name without wiping the board.</p>
    <table><thead><tr>
      <th>Name</th><th>Game</th><th class="num">Score</th><th class="num">Time</th><th></th>
    </tr></thead><tbody id="recentBody">
      <tr><td colspan="5" class="muted">Loading…</td></tr>
    </tbody></table>
  </div>
</div>

<script>
const TOKEN = ${JSON.stringify(token)};
const GAMES = ${gamesJson};
const titleOf = s => (GAMES.find(g => g.slug === s) || {}).title || s;
const msg = document.getElementById('msg');

function say(text, bad){ msg.textContent = text; msg.className = bad ? 'bad' : ''; }
function fmtTime(ms){ const s = Math.round(ms/1000); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }
function fmtDate(iso){ return iso ? new Date(iso).toLocaleString() : '—'; }
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

async function act(action, payload){
  const res = await fetch('/api/admin-action', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(Object.assign({ action, token: TOKEN }, payload || {}))
  });
  const data = await res.json().catch(() => ({ ok:false, error:'Bad response from server.' }));
  if (!data.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function renderStats(stats){
  const body = document.getElementById('statsBody');
  body.innerHTML = GAMES.map(g => {
    const s = stats[g.slug] || { plays:0, top:null, last:null };
    return '<tr><td>' + esc(g.title) + '</td>' +
      '<td class="num">' + s.plays + '</td>' +
      '<td class="num">' + (s.top === null ? '—' : s.top) + '</td>' +
      '<td class="num">' + fmtDate(s.last) + '</td>' +
      '<td style="text-align:right"><button class="danger" data-clear="' + g.slug + '"' + (s.plays ? '' : ' disabled') + '>Clear</button></td></tr>';
  }).join('');
}

function renderRecent(rows){
  const body = document.getElementById('recentBody');
  if (!rows.length){ body.innerHTML = '<tr><td colspan="5" class="muted">No scores yet.</td></tr>'; return; }
  body.innerHTML = rows.map(r =>
    '<tr><td>' + esc(r.player) + '</td><td class="muted">' + esc(titleOf(r.game)) + '</td>' +
    '<td class="num">' + r.score + '/' + r.max_score + '</td>' +
    '<td class="num">' + fmtTime(r.duration_ms) + '</td>' +
    '<td style="text-align:right"><button data-del="' + r.id + '">Remove</button></td></tr>'
  ).join('');
}

async function load(){
  try {
    const data = await act('stats');
    renderStats(data.stats);
    renderRecent(data.recent);
    say('Counts updated ' + new Date().toLocaleTimeString() + '.');
  } catch (e) { say(e.message, true); }
}

document.addEventListener('click', async (ev) => {
  const clear = ev.target.closest('[data-clear]');
  const del = ev.target.closest('[data-del]');
  try {
    if (clear){
      const slug = clear.dataset.clear;
      if (!confirm('Delete every score for “' + titleOf(slug) + '”? This cannot be undone.')) return;
      const r = await act('clear', { game: slug });
      say('Removed ' + r.deleted + ' entries from ' + titleOf(slug) + '.');
      load();
    } else if (del){
      if (!confirm('Remove this single entry?')) return;
      await act('delete', { id: Number(del.dataset.del) });
      say('Entry removed.');
      load();
    }
  } catch (e) { say(e.message, true); }
});

document.getElementById('refreshBtn').onclick = load;

document.getElementById('initBtn').onclick = async () => {
  try { await act('init'); say('Tables are ready.'); load(); }
  catch (e) { say(e.message, true); }
};

document.getElementById('wipeBtn').onclick = async () => {
  if (!confirm('Delete ALL scores for ALL eight games?')) return;
  if (prompt('Type ERASE to confirm.') !== 'ERASE') { say('Cancelled.'); return; }
  try { const r = await act('clearAll'); say('Removed ' + r.deleted + ' entries in total.'); load(); }
  catch (e) { say(e.message, true); }
};

load();
</script>
</body></html>`);
}
