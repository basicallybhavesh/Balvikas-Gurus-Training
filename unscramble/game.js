(function () {
  'use strict';

  const DATA = window.UNSCRAMBLE;
  const BASE = 120, SPEED = 80, HINT_COST = 40;
  const MAX = DATA.words.length * (BASE + SPEED);

  BV.setup({ slug: 'unscramble', title: 'Unscramble the Hidden Word', accent: 'indigo', maxScore: MAX });

  const clueEl = document.getElementById('clue');
  const fuseEl = document.getElementById('fuse');
  const fuseBar = fuseEl.querySelector('i');
  const answerEl = document.getElementById('answer');
  const poolEl = document.getElementById('pool');
  const revealEl = document.getElementById('reveal');
  const nextBtn = document.getElementById('nextBtn');
  const hintBtn = document.getElementById('hintBtn');
  const rail = BV.rail(document.getElementById('rail'), DATA.words.length);

  let ix = 0, score = 0, placed = [], pool = [], limit = 45, left = 0, ticker = null, hinted = false, over = false;
  const breakdown = [];

  function scramble(word) {
    const letters = word.split('');
    let out;
    do { out = BV.shuffle(letters); } while (out.join('') === word && word.length > 1);
    return out;
  }

  function loadWord() {
    const w = DATA.words[ix];
    over = false; hinted = false;
    placed = new Array(w.word.length).fill(null);
    pool = scramble(w.word).map((ch, i) => ({ ch, i, used: false }));
    limit = w.seconds || DATA.seconds || 45;
    left = limit;

    clueEl.textContent = w.clue;
    revealEl.hidden = true;
    nextBtn.hidden = true;
    hintBtn.disabled = false;
    hintBtn.textContent = 'Hint (−' + HINT_COST + ')';
    answerEl.className = 'answer';
    rail.now(ix);
    draw();
    startFuse();
  }

  function draw() {
    const w = DATA.words[ix].word;
    let html = '';
    for (let k = 0; k < w.length; k++) {
      html += placed[k] != null
        ? '<button type="button" class="letter" data-slot="' + k + '">' + pool[placed[k]].ch + '</button>'
        : '<span class="blank"></span>';
    }
    answerEl.innerHTML = html;
    poolEl.innerHTML = pool.map((p, i) =>
      '<button type="button" class="letter' + (p.used ? ' spent' : '') + '" data-pool="' + i +
      '"' + (p.used ? ' disabled' : '') + '>' + p.ch + '</button>').join('');
  }

  function startFuse() {
    clearInterval(ticker);
    fuseBar.style.width = '100%';
    fuseEl.classList.remove('low');
    ticker = setInterval(() => {
      left -= 0.25;
      const pct = Math.max(0, left / limit) * 100;
      fuseBar.style.width = pct + '%';
      fuseEl.classList.toggle('low', pct < 25);
      if (left <= 0) { clearInterval(ticker); timeUp(); }
    }, 250);
  }

  poolEl.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-pool]');
    if (!btn || over) return;
    const i = Number(btn.dataset.pool);
    if (pool[i].used) return;
    const firstEmpty = nextEmptySlot();
    if (firstEmpty === -1) return;
    pool[i].used = true;
    placed[firstEmpty] = i;
    BV.sfx.tick();
    draw();
    if (nextEmptySlot() === -1) check();
  });

  function nextEmptySlot() {
    const len = DATA.words[ix].word.length;
    for (let k = 0; k < len; k++) if (placed[k] == null) return k;
    return -1;
  }

  answerEl.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-slot]');
    if (!btn || over) return;
    const k = Number(btn.dataset.slot);
    if (placed[k] == null) return;
    pool[placed[k]].used = false;
    placed[k] = null;
    answerEl.className = 'answer';
    draw();
  });

  function currentGuess() {
    return placed.map(i => (i == null ? '?' : pool[i].ch)).join('');
  }

  function check() {
    const w = DATA.words[ix].word;
    if (currentGuess() === w) { win(); return; }
    answerEl.className = 'answer wrong';
    answerEl.classList.add('shake');
    BV.sfx.bad();
    setTimeout(() => answerEl.classList.remove('shake'), 420);
  }

  function win() {
    over = true;
    clearInterval(ticker);
    answerEl.className = 'answer right';
    const bonus = Math.round(SPEED * Math.max(0, left) / limit);
    let got = BASE + bonus - (hinted ? HINT_COST : 0);
    got = Math.max(0, got);
    score += got;
    BV.setScore(score);
    BV.sfx.good();
    BV.toast('+' + got + (bonus ? ' (speed ' + bonus + ')' : ''), 'good');
    if (DATA.words[ix].pair) {
      revealEl.hidden = false;
      revealEl.textContent = DATA.words[ix].word + ' \u2014 ' + DATA.words[ix].pair;
    }
    rail.mark(ix, 'done');
    breakdown.push({ label: DATA.words[ix].word, value: '+' + got, ok: true });
    finishWord();
  }

  function timeUp() {
    if (over) return;
    over = true;
    answerEl.className = 'answer wrong';
    BV.sfx.bad();
    rail.mark(ix, 'miss');
    breakdown.push({ label: DATA.words[ix].word, value: 'ran out of time', ok: false });
    revealEl.hidden = false;
    revealEl.textContent = 'The word was ' + DATA.words[ix].word;
    finishWord();
  }

  function giveUp() {
    if (over) return;
    over = true;
    clearInterval(ticker);
    BV.sfx.bad();
    rail.mark(ix, 'miss');
    breakdown.push({ label: DATA.words[ix].word, value: 'skipped', ok: false });
    revealEl.hidden = false;
    revealEl.textContent = 'The word was ' + DATA.words[ix].word;
    finishWord();
  }

  function finishWord() {
    hintBtn.disabled = true;
    nextBtn.hidden = false;
    nextBtn.textContent = ix + 1 >= DATA.words.length ? 'See your score' : 'Next word';
  }

  hintBtn.onclick = function () {
    if (over || hinted) return;
    hinted = true;
    hintBtn.disabled = true;
    hintBtn.textContent = 'Hint used';
    const w = DATA.words[ix].word;
    /* place the first letter correctly, pulling it back out of the line if needed */
    const k = 0;
    if (placed[k] != null) { pool[placed[k]].used = false; placed[k] = null; }
    const src = pool.findIndex(p => !p.used && p.ch === w[0]);
    if (src !== -1) { pool[src].used = true; placed[0] = src; }
    draw();
    if (nextEmptySlot() === -1) check();
  };

  document.getElementById('clearBtn').onclick = function () {
    if (over) return;
    placed = new Array(DATA.words[ix].word.length).fill(null);
    pool.forEach(p => { p.used = false; });
    answerEl.className = 'answer';
    draw();
  };

  document.getElementById('skipBtn').onclick = giveUp;

  nextBtn.onclick = function () {
    ix++;
    if (ix >= DATA.words.length) {
      const solved = breakdown.filter(b => b.ok).length;
      return BV.finish({
        score, maxScore: MAX,
        headline: solved === DATA.words.length ? 'Every word, unscrambled' : 'Words finished',
        sub: solved + ' of ' + DATA.words.length + ' words solved',
        breakdown, meta: { solved }
      });
    }
    loadWord();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  document.getElementById('startBtn').onclick = function () {
    document.getElementById('start').hidden = true;
    document.getElementById('play').hidden = false;
    loadWord();
    BV.timer.start();
  };
})();
