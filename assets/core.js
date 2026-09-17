/* ==========================================================================
   Shared game engine
   Every game page loads this. It owns: the top bar, the clock, sounds,
   pointer drag-and-drop that works on touch, the end-of-game sheet,
   name capture, score saving and the leaderboard.
   ========================================================================== */
(function (global) {
  'use strict';

  const BV = {};
  const NAME_KEY = 'bv:player';
  const SOUND_KEY = 'bv:sound';

  /* Keep the page invisible until BV.setup has put the top bar in place,
     otherwise the bar pops in a beat later and everything jumps down. */
  document.documentElement.classList.add('bv-loading');

  /* ----------------------------- utilities ---------------------------- */

  BV.esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  BV.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  BV.sample = (arr, n) => BV.shuffle(arr).slice(0, n);

  /* Loads every image up front so the reveal effects (blur, sliding covers)
     run on a picture that is already in memory instead of popping in
     mid-animation. Never rejects — a broken URL just resolves anyway,
     since a stuck "Loading…" button is worse than one missing picture. */
  BV.preloadImages = function (urls) {
    const unique = Array.from(new Set(urls.filter(Boolean)));
    const loadOne = src => new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = src;
    });
    return Promise.all(unique.map(loadOne));
  };

  BV.clock = function (ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };

  BV.playerName = () => {
    try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
  };
  BV.setPlayerName = v => {
    try { localStorage.setItem(NAME_KEY, v); } catch { /* private mode */ }
  };

  /* ------------------------------- sound ------------------------------ */

  const Sfx = {
    on: (() => { try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; } })(),
    ctx: null,
    toggle() {
      this.on = !this.on;
      try { localStorage.setItem(SOUND_KEY, this.on ? 'on' : 'off'); } catch {}
      return this.on;
    },
    tone(freq, dur, type, vol) {
      if (!this.on) return;
      try {
        if (!this.ctx) this.ctx = new (global.AudioContext || global.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type || 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol || 0.08, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + dur);
      } catch { /* audio unavailable */ }
    },
    good() { this.tone(660, .12, 'triangle'); setTimeout(() => this.tone(880, .16, 'triangle'), 90); },
    bad() { this.tone(200, .22, 'sawtooth', .05); },
    tick() { this.tone(520, .05, 'sine', .04); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, .3, 'triangle'), i * 130)); }
  };
  BV.sfx = Sfx;

  /* ------------------------------ toast ------------------------------- */

  let toastEl = null, toastTimer = null;
  BV.toast = function (text, kind) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.className = 'toast on ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = 'toast ' + (kind || ''); }, 1600);
  };

  /* ---------------------------- flower burst -------------------------- */

  BV.petals = function (count) {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let box = document.querySelector('.petals');
    if (!box) { box = document.createElement('div'); box.className = 'petals'; document.body.appendChild(box); }
    const pool = ['🌼', '🌸', '🪷', '🌺', '✨', '🌻'];
    for (let i = 0; i < (count || 22); i++) {
      const s = document.createElement('span');
      s.textContent = pool[Math.floor(Math.random() * pool.length)];
      s.style.left = Math.random() * 100 + 'vw';
      s.style.fontSize = (15 + Math.random() * 15) + 'px';
      s.style.animationDuration = (3 + Math.random() * 2.4) + 's';
      s.style.animationDelay = (Math.random() * 1.1) + 's';
      box.appendChild(s);
      setTimeout(() => s.remove(), 7200);
    }
  };

  /* ------------------------------- clock ------------------------------ */

  BV.timer = {
    _start: 0, _acc: 0, _running: false, _raf: null, _el: null,
    start() {
      if (this._running) return;
      this._running = true;
      this._start = performance.now();
      const loop = () => {
        if (!this._running) return;
        if (this._el) this._el.textContent = BV.clock(this.ms());
        this._raf = requestAnimationFrame(loop);
      };
      loop();
    },
    stop() {
      if (!this._running) return;
      this._acc += performance.now() - this._start;
      this._running = false;
      cancelAnimationFrame(this._raf);
      if (this._el) this._el.textContent = BV.clock(this.ms());
    },
    reset() { this._acc = 0; this._running = false; cancelAnimationFrame(this._raf); if (this._el) this._el.textContent = '0:00'; },
    ms() { return this._acc + (this._running ? performance.now() - this._start : 0); }
  };

  /* ------------------------------ top bar ----------------------------- */

  let cfg = {};
  let scoreEl = null;

  BV.setup = function (options) {
    cfg = options || {};
    if (cfg.accent) document.body.dataset.accent = cfg.accent;

    const site = global.SITE || { name: 'Games', footer: '' };
    document.title = (cfg.title ? cfg.title + ' · ' : '') + site.name;
    document.querySelectorAll('[data-site="name"]').forEach(el => { el.textContent = site.name; });
    document.querySelectorAll('[data-site="tagline"]').forEach(el => { el.textContent = site.tagline || ''; });
    document.querySelectorAll('[data-site="footer"]').forEach(el => { el.textContent = site.footer || site.name; });

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.innerHTML =
      '<a class="home" href="/" title="All games" aria-label="All games">🏠</a>' +
      '<div class="name">' + BV.esc(cfg.title || '') + '</div>' +
      (cfg.showScore === false ? '' : '<div class="stat"><b id="bvScore">0</b><span>pts</span></div>') +
      (cfg.showTimer === false ? '' : '<div class="stat"><b id="bvClock">0:00</b><span>time</span></div>') +
      '<button class="home" id="bvSound" title="Sound on or off" aria-label="Sound on or off"></button>';

    const wrap = document.querySelector('.wrap');
    wrap.insertBefore(bar, wrap.firstChild);

    scoreEl = document.getElementById('bvScore');
    BV.timer._el = document.getElementById('bvClock');

    const sBtn = document.getElementById('bvSound');
    const paint = () => { sBtn.textContent = Sfx.on ? '🔊' : '🔇'; };
    paint();
    sBtn.onclick = () => { Sfx.toggle(); paint(); if (Sfx.on) Sfx.tick(); };

    buildSheet();

    // Reveal once the web fonts are in too, so text does not reflow. Never wait more than a moment.
    const reveal = () => document.documentElement.classList.remove('bv-loading');
    const fonts = document.fonts && document.fonts.ready;
    if (fonts) Promise.race([fonts, new Promise(r => setTimeout(r, 700))]).then(reveal, reveal);
    else reveal();
  };

  BV.setScore = function (n) { if (scoreEl) scoreEl.textContent = n; };

  /* ----------------------- pointer drag and drop ----------------------- *
     Works with mouse, pen and touch. Two ways to move a chip:
       drag it, or tap the chip then tap a slot.
     Markup contract: draggables carry .chip, targets carry .slot.
     ------------------------------------------------------------------- */

  BV.dnd = function (root, opts) {
    opts = opts || {};
    let ghost = null, source = null, chosen = null, startX = 0, startY = 0, dragging = false, overSlot = null;
    let swallowClick = false;

    const clearChosen = () => {
      if (chosen) chosen.classList.remove('chosen');
      chosen = null;
    };

    function slotAt(x, y) {
      const el = document.elementFromPoint(x, y);
      return el ? el.closest('.slot') : null;
    }

    function markOver(slot) {
      if (overSlot === slot) return;
      if (overSlot) overSlot.classList.remove('over');
      overSlot = slot;
      if (overSlot) overSlot.classList.add('over');
    }

    root.addEventListener('pointerdown', ev => {
      const chip = ev.target.closest('.chip');
      if (!chip || chip.classList.contains('used') || root.dataset.locked === '1') return;
      source = chip;
      startX = ev.clientX; startY = ev.clientY;
      dragging = false;
      chip.setPointerCapture(ev.pointerId);
    });

    root.addEventListener('pointermove', ev => {
      if (!source) return;
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) < 7) return;
      if (!dragging) {
        dragging = true;
        clearChosen();
        ghost = source.cloneNode(true);
        ghost.classList.add('chip-ghost');
        ghost.style.width = source.offsetWidth + 'px';
        document.body.appendChild(ghost);
        source.classList.add('lifted');
      }
      ev.preventDefault();
      ghost.style.left = ev.clientX + 'px';
      ghost.style.top = ev.clientY + 'px';
      ghost.style.display = 'none';
      markOver(slotAt(ev.clientX, ev.clientY));
      ghost.style.display = '';
    }, { passive: false });

    function endDrag(ev) {
      if (!source) return;
      const chip = source;
      if (dragging) {
        if (ghost) { ghost.remove(); ghost = null; }
        chip.classList.remove('lifted');
        const target = slotAt(ev.clientX, ev.clientY);
        markOver(null);
        if (target && opts.onDrop) opts.onDrop(chip, target);
        swallowClick = true;
      }
      source = null; dragging = false;
    }
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', () => {
      if (ghost) { ghost.remove(); ghost = null; }
      if (source) source.classList.remove('lifted');
      markOver(null); source = null; dragging = false;
    });

    /* Selection lives on click rather than pointerup so that a keyboard
       Enter on a chip selects it just as a tap does. */
    root.addEventListener('click', ev => {
      if (swallowClick) { swallowClick = false; return; }
      if (root.dataset.locked === '1') return;

      const chip = ev.target.closest('.chip');
      if (chip && !chip.classList.contains('used')) {
        if (chosen === chip) { clearChosen(); }
        else { clearChosen(); chosen = chip; chip.classList.add('chosen'); Sfx.tick(); }
        return;
      }

      const slot = ev.target.closest('.slot');
      if (!slot) return;
      if (chosen) {
        const chip = chosen;
        clearChosen();
        if (opts.onDrop) opts.onDrop(chip, slot);
      } else if (slot.classList.contains('filled') && opts.onTakeBack) {
        opts.onTakeBack(slot);
      }
    });

    return { clearChosen };
  };

  /* --------------------------- result sheet --------------------------- */

  function buildSheet() {
    if (document.getElementById('bvSheet')) return;
    const s = document.createElement('div');
    s.className = 'sheet';
    s.id = 'bvSheet';
    s.hidden = true;
    s.innerHTML =
      '<div class="sheet-inner">' +
        '<div class="namestep" id="bvNameStep">' +
          '<h2>That’s the last one!</h2>' +
          '<p class="hint">Add your name to save your score and see how you did. The clock is already stopped.</p>' +
          '<div class="namebox">' +
            '<input id="bvName" maxlength="24" placeholder="Your name" autocomplete="off" spellcheck="false">' +
            '<button class="btn" id="bvSave">Save</button>' +
          '</div>' +
          '<div id="bvSaveMsg"></div>' +
        '</div>' +
        '<div id="bvResultStep" hidden>' +
          '<div class="sheet-head">' +
            '<h2 id="bvHead">Well played</h2>' +
            '<div class="sub" id="bvSub"></div>' +
            '<div class="scoreline">' +
              '<div><b id="bvFinal">0</b><span id="bvOutOf">points</span></div>' +
              '<div><b id="bvTime">0:00</b><span>time taken</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="sheet-body">' +
            '<ul class="breakdown" id="bvBreak"></ul>' +
            '<p class="saved" id="bvSaved"></p>' +
            '<div class="board-head">' +
              '<h3>Leaderboard</h3>' +
              '<button class="btn ghost small" id="bvRefresh">Refresh</button>' +
            '</div>' +
            '<div id="bvBoard"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(s);

    document.getElementById('bvRefresh').onclick = function () {
      this.disabled = true;
      this.textContent = 'Refreshing';
      BV.loadBoard(document.getElementById('bvBoard')).finally(() => {
        this.disabled = false;
        this.textContent = 'Refresh';
      });
    };
  }

  /* -------------------------- leaderboard ----------------------------- */

  let lastSavedName = '';

  BV.loadBoard = function (el, limit) {
    el.innerHTML = '<p class="hint">Loading the board…</p>';
    return fetch('/api/leaderboard?game=' + encodeURIComponent(cfg.slug) + '&limit=' + (limit || 20))
      .then(r => r.json())
      .then(data => {
        if (!data.ok) throw new Error(data.error || 'Could not load.');
        if (!data.rows.length) {
          el.innerHTML = '<p class="hint">No scores yet. Yours will be the first one here.</p>';
          return;
        }
        const rows = data.rows.map(r => {
          const cls = [];
          if (r.rank <= 3) cls.push('top' + r.rank);
          if (lastSavedName && r.player === lastSavedName) cls.push('me');
          return '<tr class="' + cls.join(' ') + '">' +
            '<td class="rk">' + r.rank + '</td>' +
            '<td class="who">' + BV.esc(r.player) + '</td>' +
            '<td class="r">' + r.score + '</td>' +
            '<td class="r">' + BV.clock(r.durationMs) + '</td></tr>';
        }).join('');
        el.innerHTML =
          '<table class="board"><thead><tr><th></th><th>Name</th>' +
          '<th class="r">Points</th><th class="r">Time</th></tr></thead><tbody>' + rows +
          '</tbody></table>' +
          '<p class="board-note">' + data.plays + ' attempt' + (data.plays === 1 ? '' : 's') +
          ' so far · read at ' + new Date(data.fetchedAt).toLocaleTimeString() +
          ' · ties are broken by the faster time</p>';
      })
      .catch(err => {
        el.innerHTML = '<p class="saveerr">' + BV.esc(err.message) +
          ' Press Refresh to try again.</p>';
      });
  };

  /* ---------------------------- finishing ----------------------------- */

  BV.finish = function (result) {
    BV.timer.stop();
    const ms = BV.timer.ms();
    const score = Math.round(result.score);
    const max = Math.round(result.maxScore != null ? result.maxScore : (cfg.maxScore || score));

    document.getElementById('bvHead').textContent = result.headline || 'Well played';
    document.getElementById('bvSub').textContent = result.sub || '';
    document.getElementById('bvFinal').textContent = score;
    document.getElementById('bvOutOf').textContent = 'out of ' + max;
    document.getElementById('bvTime').textContent = BV.clock(ms);

    const list = document.getElementById('bvBreak');
    list.innerHTML = (result.breakdown || []).map(b =>
      '<li><span class="q">' + BV.esc(b.label) + '</span>' +
      '<span class="a ' + (b.ok === true ? 'ok' : b.ok === false ? 'no' : '') + '">' +
      BV.esc(b.value) + '</span></li>').join('');

    const sheet = document.getElementById('bvSheet');
    const nameStep = document.getElementById('bvNameStep');
    const resultStep = document.getElementById('bvResultStep');
    const nameInput = document.getElementById('bvName');
    const saveBtn = document.getElementById('bvSave');
    const saveMsg = document.getElementById('bvSaveMsg');
    const board = document.getElementById('bvBoard');

    nameStep.hidden = false;
    resultStep.hidden = true;
    saveMsg.innerHTML = '';
    nameInput.value = BV.playerName();
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
    sheet.hidden = false;

    function reveal(player, rank) {
      const savedEl = document.getElementById('bvSaved');
      if (rank) {
        lastSavedName = player;
        savedEl.className = 'saved';
        savedEl.textContent = 'Saved. ' + player + ' is number ' + rank + ' on this board.';
      } else {
        savedEl.className = 'saveerr';
        savedEl.textContent = 'This score was not saved to the leaderboard.';
      }
      nameStep.hidden = true;
      resultStep.hidden = false;
      sheet.scrollTop = 0;
      BV.loadBoard(board);
      if (score > 0) { Sfx.win(); BV.petals(score >= max * 0.7 ? 34 : 16); }
    }

    function save() {
      const player = nameInput.value.trim();
      if (!player) { nameInput.focus(); BV.toast('Type a name first', 'bad'); return; }
      BV.setPlayerName(player);
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving';
      saveMsg.innerHTML = '';
      fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: cfg.slug, player, score, maxScore: max,
          durationMs: Math.round(ms), meta: result.meta || {}
        })
      })
        .then(r => r.json())
        .then(data => {
          if (!data.ok) throw new Error(data.error || 'Could not save.');
          reveal(player, data.rank);
        })
        .catch(err => {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Try again';
          saveMsg.innerHTML = '<p class="saveerr">' + BV.esc(err.message) + '</p>' +
            '<button type="button" class="btn ghost small" id="bvSkip">Show my score without saving</button>';
          document.getElementById('bvSkip').onclick = () => reveal(player, 0);
        });
    }

    saveBtn.onclick = save;
    nameInput.onkeydown = e => { if (e.key === 'Enter') save(); };
    setTimeout(() => nameInput.focus({ preventScroll: true }), 350);
  };

  /* ----------------------- small helper for pages ---------------------- */

  BV.rail = function (el, n) {
    el.innerHTML = Array.from({ length: n }, () => '<i></i>').join('');
    return {
      set(i, state) {
        const kids = el.children;
        for (let k = 0; k < kids.length; k++) kids[k].classList.remove('now');
        if (kids[i]) { kids[i].className = state || ''; }
      },
      mark(i, state) { if (el.children[i]) el.children[i].className = state; },
      now(i) {
        for (let k = 0; k < el.children.length; k++) el.children[k].classList.remove('now');
        if (el.children[i] && !el.children[i].className) el.children[i].classList.add('now');
      }
    };
  };

  global.BV = BV;
})(window);
