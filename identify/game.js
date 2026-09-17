(function () {
  'use strict';

  const DATA = window.IDENTIFY;
  const HIGH = DATA.high || 300, LOW = DATA.low || 100, SPAN = DATA.seconds || 12;
  const MAX = DATA.items.length * HIGH;

  BV.setup({ slug: 'identify', title: 'Identify the Character', accent: 'plum', maxScore: MAX });

  const pic = document.getElementById('pic');
  const optsEl = document.getElementById('opts');
  const worthEl = document.getElementById('worth');
  const verdictEl = document.getElementById('verdict');
  const afterEl = document.getElementById('after');
  const nextBtn = document.getElementById('nextBtn');
  const rail = BV.rail(document.getElementById('rail'), DATA.items.length);

  const deck = BV.shuffle(DATA.items);
  let ix = 0, score = 0, elapsed = 0, ticker = null, answered = false;
  const breakdown = [];

  function worthNow() {
    const t = Math.min(1, elapsed / SPAN);
    return Math.max(LOW, Math.round(HIGH - (HIGH - LOW) * t));
  }

  function optionsFor(item) {
    const others = DATA.items.map(i => i.name).filter(n => n !== item.name);
    const wrong = BV.shuffle(others.concat(DATA.decoys)).slice(0, 5);
    return BV.shuffle(wrong.concat(item.name));
  }

  function startRound() {
    const item = deck[ix];
    answered = false;
    elapsed = 0;
    verdictEl.hidden = true;
    afterEl.hidden = true;
    nextBtn.hidden = true;
    rail.now(ix);

    pic.src = item.img;
    pic.style.transition = 'none';
    pic.style.filter = 'blur(14px) saturate(.6)';
    pic.style.transform = 'scale(1.14)';
    pic.offsetWidth; // force reflow so the reset above is not animated
    pic.style.transition = '';
    worthEl.textContent = HIGH;

    optsEl.innerHTML = optionsFor(item).map(n =>
      '<button type="button" class="opt" data-n="' + BV.esc(n) + '">' + BV.esc(n) + '</button>').join('');

    clearInterval(ticker);
    ticker = setInterval(() => {
      elapsed += 0.25;
      const t = Math.min(1, elapsed / SPAN);
      pic.style.filter = 'blur(' + (14 * (1 - t)).toFixed(2) + 'px) saturate(' + (0.6 + 0.4 * t).toFixed(2) + ')';
      pic.style.transform = 'scale(' + (1.14 - 0.14 * t).toFixed(3) + ')';
      worthEl.textContent = worthNow();
      if (t >= 1) clearInterval(ticker);
    }, 250);
  }

  optsEl.addEventListener('click', ev => {
    const btn = ev.target.closest('.opt');
    if (!btn || answered) return;
    answered = true;
    clearInterval(ticker);

    const item = deck[ix];
    const got = worthNow();
    const correct = btn.dataset.n === item.name;

    pic.style.filter = 'none';
    pic.style.transform = 'scale(1)';

    optsEl.querySelectorAll('.opt').forEach(o => {
      o.disabled = true;
      if (o.dataset.n === item.name) o.classList.add('right');
    });
    if (!correct) btn.classList.add('wrong');

    verdictEl.hidden = false;
    if (correct) {
      score += got;
      BV.setScore(score);
      BV.sfx.good();
      verdictEl.style.color = 'var(--good)';
      verdictEl.textContent = item.name + '. +' + got;
    } else {
      BV.sfx.bad();
      verdictEl.style.color = 'var(--bad)';
      verdictEl.textContent = 'It was ' + item.name + '.';
    }

    afterEl.hidden = false;
    afterEl.textContent = item.after || '';
    rail.mark(ix, correct ? 'done' : 'miss');
    breakdown.push({ label: item.name, value: correct ? '+' + got : btn.dataset.n, ok: correct });

    BV.timer.stop();   // pause between rounds
    nextBtn.hidden = false;
    nextBtn.textContent = ix + 1 >= deck.length ? 'See your score' : 'Next picture';
  });

  nextBtn.onclick = function () {
    ix++;
    if (ix >= deck.length) {
      const right = breakdown.filter(b => b.ok).length;
      return BV.finish({
        score, maxScore: MAX,
        headline: right === deck.length ? 'Named every one' : 'Pictures finished',
        sub: right + ' of ' + deck.length + ' identified',
        breakdown, meta: { identified: right }
      });
    }
    BV.timer.start();   // clock was paused while the answer was shown
    startRound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startBtn = document.getElementById('startBtn');
  startBtn.onclick = function () {
    startBtn.disabled = true;
    startBtn.textContent = 'Loading pictures…';
    BV.preloadImages(deck.map(item => item.img)).then(() => {
      document.getElementById('start').hidden = true;
      document.getElementById('play').hidden = false;
      startRound();
      BV.timer.start();
    });
  };
})();
