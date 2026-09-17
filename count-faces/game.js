(function () {
  'use strict';

  const DATA = window.COUNTFACES;
  const EXACT = 150, NEAR = 50;
  const MAX = DATA.rounds.length * EXACT;

  BV.setup({ slug: 'count-faces', title: 'Count the Happy Faces', accent: 'marigold', maxScore: MAX });

  const crowd = document.getElementById('crowd');
  const fuseEl = document.getElementById('fuse');
  const fuseBar = fuseEl.querySelector('i');
  const answerArea = document.getElementById('answerArea');
  const guessEl = document.getElementById('guess');
  const verdictEl = document.getElementById('verdict');
  const nextBtn = document.getElementById('nextBtn');
  const peekBtn = document.getElementById('peekBtn');
  const lockBtn = document.getElementById('lockBtn');
  const rail = BV.rail(document.getElementById('rail'), DATA.rounds.length);

  let ix = 0, score = 0, truth = 0, peeked = false, ticker = null, locked = false;
  const breakdown = [];

  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  /* Jittered grid so faces sit apart without a mechanical look. */
  function layout(n, ratio) {
    const cols = Math.max(3, Math.round(Math.sqrt(n * ratio)));
    const rows = Math.ceil(n / cols);
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
    const spots = BV.shuffle(cells).slice(0, n).map(([c, r]) => ({
      x: ((c + 0.5) / cols) * 86 + 7 + (Math.random() * 5 - 2.5),
      y: ((r + 0.5) / rows) * 84 + 8 + (Math.random() * 5 - 2.5)
    }));
    return { spots, cols };
  }

  function build() {
    const r = DATA.rounds[ix];
    truth = rnd(r.min, Math.min(r.max, r.total - 2));

    const moods = [];
    for (let i = 0; i < truth; i++) moods.push('happy');
    for (let i = truth; i < r.total; i++) {
      moods.push(window.NOT_HAPPY_MOODS[i % window.NOT_HAPPY_MOODS.length]);
    }

    const wide = (window.innerWidth || 360) >= 640;
    const { spots, cols } = layout(r.total, wide ? 16 / 9 : 4 / 3);
    const size = Math.min(13, Math.max(6.5, 78 / cols));

    crowd.innerHTML = BV.shuffle(moods).map((m, i) =>
      '<b class="' + (r.drift ? 'drift' : '') + '" data-m="' + m + '" style="' +
      'left:' + spots[i].x.toFixed(1) + '%;top:' + spots[i].y.toFixed(1) + '%;' +
      'width:' + size.toFixed(2) + '%;aspect-ratio:1/1;' +
      'animation-delay:' + (Math.random() * 2).toFixed(2) + 's">' +
      window.makeFace(m) + '</b>').join('') +
      '<div class="curtain" hidden>Lights out.<br>How many were smiling?</div>';
  }

  function startRound() {
    const r = DATA.rounds[ix];
    locked = false; peeked = false;
    answerArea.hidden = true;
    verdictEl.hidden = true;
    nextBtn.hidden = true;
    peekBtn.hidden = false;
    peekBtn.disabled = false;
    peekBtn.textContent = 'Look again (half points)';
    lockBtn.disabled = false;
    guessEl.value = 0;
    rail.now(ix);
    build();
    runFuse(r.seconds, closeCurtain);
  }

  function runFuse(seconds, done) {
    clearInterval(ticker);
    let left = seconds;
    fuseBar.style.width = '100%';
    fuseEl.classList.remove('low');
    ticker = setInterval(() => {
      left -= 0.1;
      const pct = Math.max(0, left / seconds) * 100;
      fuseBar.style.width = pct + '%';
      fuseEl.classList.toggle('low', pct < 30);
      if (left <= 0) { clearInterval(ticker); done(); }
    }, 100);
  }

  function closeCurtain() {
    const c = crowd.querySelector('.curtain');
    if (c) c.hidden = false;
    answerArea.hidden = false;
    BV.sfx.tick();
    guessEl.focus({ preventScroll: true });
  }

  peekBtn.onclick = function () {
    if (locked || peeked) return;
    peeked = true;
    peekBtn.disabled = true;
    peekBtn.textContent = 'Second look used';
    const c = crowd.querySelector('.curtain');
    if (c) c.hidden = true;
    runFuse(1.6, () => { if (c) c.hidden = false; });
  };

  document.getElementById('plus').onclick = () => { guessEl.value = Math.min(99, (+guessEl.value || 0) + 1); };
  document.getElementById('minus').onclick = () => { guessEl.value = Math.max(0, (+guessEl.value || 0) - 1); };
  guessEl.addEventListener('keydown', e => { if (e.key === 'Enter') lockBtn.click(); });

  lockBtn.onclick = function () {
    if (locked) return;
    locked = true;
    clearInterval(ticker);
    const said = Math.max(0, Math.min(99, parseInt(guessEl.value, 10) || 0));
    const gap = Math.abs(said - truth);
    let got = gap === 0 ? EXACT : gap === 1 ? NEAR : 0;
    if (peeked) got = Math.round(got / 2);
    score += got;
    BV.setScore(score);

    const c = crowd.querySelector('.curtain');
    if (c) c.hidden = true;
    crowd.querySelectorAll('b').forEach(b => {
      if (b.dataset.m !== 'happy') b.classList.add('dim');
    });

    verdictEl.hidden = false;
    if (gap === 0) {
      verdictEl.className = 'verdict ok';
      verdictEl.textContent = 'Exactly ' + truth + '. +' + got;
      BV.sfx.good();
    } else {
      verdictEl.className = 'verdict no';
      verdictEl.textContent = 'There were ' + truth + '. You said ' + said + '.' + (got ? ' +' + got : '');
      BV.sfx.bad();
    }

    rail.mark(ix, gap <= 1 ? 'done' : 'miss');
    breakdown.push({
      label: 'Round ' + (ix + 1) + ' · ' + DATA.rounds[ix].total + ' faces',
      value: said + ' of ' + truth + ' · +' + got,
      ok: gap === 0
    });

    peekBtn.hidden = true;
    lockBtn.disabled = true;
    BV.timer.stop();   // pause between rounds
    nextBtn.hidden = false;
    nextBtn.textContent = ix + 1 >= DATA.rounds.length ? 'See your score' : 'Next round';
  };

  nextBtn.onclick = function () {
    ix++;
    if (ix >= DATA.rounds.length) {
      const exact = breakdown.filter(b => b.ok).length;
      return BV.finish({
        score, maxScore: MAX,
        headline: exact === DATA.rounds.length ? 'Not one miscounted' : 'Counting finished',
        sub: exact + ' of ' + DATA.rounds.length + ' counted exactly',
        breakdown, meta: { exact }
      });
    }
    BV.timer.start();   // clock was paused while the answer was shown
    startRound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  document.getElementById('startBtn').onclick = function () {
    document.getElementById('start').hidden = true;
    document.getElementById('play').hidden = false;
    startRound();
    BV.timer.start();
  };
})();
