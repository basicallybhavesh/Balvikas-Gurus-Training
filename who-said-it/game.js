(function () {
  'use strict';

  const DATA = window.WHOSAIDIT;
  const ROUNDS = Math.min(8, DATA.quotes.length);
  const BASE = 60, SPEED = 60, STREAK_BONUS = 40, STREAK_AT = 3;
  const MAX = ROUNDS * (BASE + SPEED) + Math.max(0, ROUNDS - (STREAK_AT - 1)) * STREAK_BONUS;

  BV.setup({ slug: 'who-said-it', title: 'Who Said It?', accent: 'rose', maxScore: MAX });

  const quoteEl = document.getElementById('quote');
  const optsEl = document.getElementById('opts');
  const noteEl = document.getElementById('note');
  const nextBtn = document.getElementById('nextBtn');
  const streakEl = document.getElementById('streak');
  const fuseEl = document.getElementById('fuse');
  const fuseBar = fuseEl.querySelector('i');
  const rail = BV.rail(document.getElementById('rail'), ROUNDS);

  const deck = BV.sample(DATA.quotes, ROUNDS);
  let ix = 0, score = 0, streak = 0, left = 0, limit = DATA.seconds || 15, ticker = null, answered = false;
  const breakdown = [];

  function optionsFor(q) {
    const wrong = BV.shuffle(DATA.speakers.filter(s => s !== q.who)).slice(0, 3);
    return BV.shuffle(wrong.concat(q.who));
  }

  function ask() {
    const q = deck[ix];
    answered = false;
    left = limit;
    quoteEl.textContent = q.text;
    quoteEl.classList.toggle('long', q.text.length > 130);
    noteEl.hidden = true;
    nextBtn.hidden = true;
    rail.now(ix);
    streakEl.textContent = streak >= 2 ? 'On a run of ' + streak : '';

    optsEl.innerHTML = optionsFor(q).map(name =>
      '<button type="button" class="opt" data-who="' + BV.esc(name) + '">' + BV.esc(name) + '</button>').join('');

    fuseEl.classList.remove('low');
    fuseBar.style.transition = 'none';
    fuseBar.style.width = '100%';
    requestAnimationFrame(() => {
      fuseBar.style.transition = 'width .1s linear';
    });

    clearInterval(ticker);
    ticker = setInterval(() => {
      left -= 0.1;
      const pct = Math.max(0, left / limit) * 100;
      fuseBar.style.width = pct + '%';
      fuseEl.classList.toggle('low', pct < 25);
      if (left <= 0) { clearInterval(ticker); resolve(null); }
    }, 100);
  }

  optsEl.addEventListener('click', ev => {
    const btn = ev.target.closest('.opt');
    if (!btn || answered) return;
    resolve(btn.dataset.who, btn);
  });

  function resolve(chosen, btn) {
    if (answered) return;
    answered = true;
    clearInterval(ticker);
    const q = deck[ix];
    const correct = chosen === q.who;

    optsEl.querySelectorAll('.opt').forEach(o => {
      o.disabled = true;
      if (o.dataset.who === q.who) o.classList.add('right');
    });
    if (btn && !correct) btn.classList.add('wrong');

    let got = 0;
    if (correct) {
      const bonus = Math.round(SPEED * Math.max(0, left) / limit);
      got = BASE + bonus;
      streak++;
      if (streak >= STREAK_AT) { got += STREAK_BONUS; }
      score += got;
      BV.setScore(score);
      BV.sfx.good();
      BV.toast('+' + got + (streak >= STREAK_AT ? ' · run of ' + streak : ''), 'good');
      rail.mark(ix, 'done');
    } else {
      streak = 0;
      BV.sfx.bad();
      BV.toast(chosen ? 'That was ' + q.who : 'Out of time', 'bad');
      rail.mark(ix, 'miss');
    }

    breakdown.push({
      label: q.text.length > 46 ? q.text.slice(0, 44) + '…' : q.text,
      value: correct ? q.who + ' +' + got : (chosen || 'no answer') + ' → ' + q.who,
      ok: correct
    });

    noteEl.hidden = false;
    noteEl.textContent = q.note;
    nextBtn.hidden = false;
    nextBtn.textContent = ix + 1 >= ROUNDS ? 'See your score' : 'Next';
    streakEl.textContent = streak >= 2 ? 'On a run of ' + streak : '';
  }

  nextBtn.onclick = function () {
    ix++;
    if (ix >= ROUNDS) {
      const right = breakdown.filter(b => b.ok).length;
      return BV.finish({
        score, maxScore: MAX,
        headline: right === ROUNDS ? 'You knew every voice' : 'Quotes finished',
        sub: right + ' of ' + ROUNDS + ' correct',
        breakdown, meta: { correct: right }
      });
    }
    ask();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  document.getElementById('startBtn').onclick = function () {
    document.getElementById('start').hidden = true;
    document.getElementById('play').hidden = false;
    ask();
    BV.timer.start();
  };
})();
