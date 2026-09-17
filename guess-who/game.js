(function () {
  'use strict';

  const DATA = window.GUESSWHO;
  const HIGH = DATA.high || 400, LOW = DATA.low || 100, SPAN = DATA.seconds || 14;
  const MAX = DATA.people.length * HIGH;

  BV.setup({ slug: 'guess-who', title: 'Guess Who?', accent: 'tulsi', maxScore: MAX });

  const pic = document.getElementById('pic');
  const cover = document.getElementById('cover');
  const worthEl = document.getElementById('worth');
  const clueEl = document.getElementById('clue');
  const optsEl = document.getElementById('opts');
  const verdictEl = document.getElementById('verdict');
  const afterEl = document.getElementById('after');
  const nextBtn = document.getElementById('nextBtn');
  const rail = BV.rail(document.getElementById('rail'), DATA.people.length);

  const deck = BV.shuffle(DATA.people);
  let ix = 0, score = 0, elapsed = 0, ticker = null, answered = false;
  const breakdown = [];

  const worthNow = () => Math.max(LOW, Math.round(HIGH - (HIGH - LOW) * Math.min(1, elapsed / SPAN)));

  function optionsFor(person) {
    const others = DATA.people.map(p => p.name).filter(n => n !== person.name);
    const wrong = BV.shuffle(others.concat(DATA.decoys)).slice(0, 5);
    return BV.shuffle(wrong.concat(person.name));
  }

  function startRound() {
    const p = deck[ix];
    answered = false;
    elapsed = 0;
    verdictEl.hidden = true;
    afterEl.hidden = true;
    clueEl.hidden = true;
    nextBtn.hidden = true;
    rail.now(ix);

    pic.src = p.img;
    pic.alt = 'Most of the face is hidden, gradually uncovering';
    cover.style.transition = 'none';
    cover.style.width = '75%';
    cover.offsetWidth; // force reflow so the jump above is not animated
    cover.style.transition = '';
    worthEl.textContent = HIGH;

    optsEl.innerHTML = optionsFor(p).map(n =>
      '<button type="button" class="opt" data-n="' + BV.esc(n) + '">' + BV.esc(n) + '</button>').join('');

    clearInterval(ticker);
    ticker = setInterval(() => {
      elapsed += 0.25;
      const t = Math.min(1, elapsed / SPAN);
      cover.style.width = (75 * (1 - t)).toFixed(2) + '%';
      worthEl.textContent = worthNow();
      if (t >= 0.5 && clueEl.hidden && p.clue) {
        clueEl.hidden = false;
        clueEl.textContent = p.clue;
        BV.sfx.tick();
      }
      if (t >= 1) clearInterval(ticker);
    }, 250);
  }

  optsEl.addEventListener('click', ev => {
    const btn = ev.target.closest('.opt');
    if (!btn || answered) return;
    answered = true;
    clearInterval(ticker);

    const p = deck[ix];
    const got = worthNow();
    const correct = btn.dataset.n === p.name;

    cover.style.width = '0%';

    optsEl.querySelectorAll('.opt').forEach(o => {
      o.disabled = true;
      if (o.dataset.n === p.name) o.classList.add('right');
    });
    if (!correct) btn.classList.add('wrong');

    verdictEl.hidden = false;
    if (correct) {
      score += got;
      BV.setScore(score);
      BV.sfx.good();
      verdictEl.style.color = 'var(--good)';
      verdictEl.textContent = p.name + '. +' + got;
    } else {
      BV.sfx.bad();
      verdictEl.style.color = 'var(--bad)';
      verdictEl.textContent = 'It was ' + p.name + '.';
    }

    clueEl.hidden = false;
    clueEl.textContent = p.clue || '';
    afterEl.hidden = false;
    afterEl.textContent = p.after || '';

    rail.mark(ix, correct ? 'done' : 'miss');
    breakdown.push({ label: p.name, value: correct ? '+' + got : btn.dataset.n, ok: correct });

    BV.timer.stop();   // pause between rounds
    nextBtn.hidden = false;
    nextBtn.textContent = ix + 1 >= deck.length ? 'See your score' : 'Next face';
  });

  nextBtn.onclick = function () {
    ix++;
    if (ix >= deck.length) {
      const right = breakdown.filter(b => b.ok).length;
      return BV.finish({
        score, maxScore: MAX,
        headline: score === MAX ? 'Named on a sliver of a face' : 'Faces finished',
        sub: right + ' of ' + deck.length + ' named',
        breakdown, meta: { named: right }
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
    BV.preloadImages(deck.map(p => p.img)).then(() => {
      document.getElementById('start').hidden = true;
      document.getElementById('play').hidden = false;
      startRound();
      BV.timer.start();
    });
  };
})();


