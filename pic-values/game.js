(function () {
  'use strict';

  const DATA = window.PICVALUES;
  const PER = DATA.perValue || 100;
  const COST = DATA.wrongCost || 50;
  const totalValues = DATA.scenes.reduce((n, s) => n + s.shows.length, 0);
  const MAX = totalValues * PER;

  BV.setup({ slug: 'pic-values', title: 'One Pic, Many Values', accent: 'saffron', maxScore: MAX });

  const picEl = document.getElementById('pic');
  const bankEl = document.getElementById('bank');
  const tallyEl = document.getElementById('tally');
  const afterEl = document.getElementById('after');
  const askHint = document.getElementById('askhint');
  const submitBtn = document.getElementById('submitBtn');
  const rail = BV.rail(document.getElementById('rail'), DATA.scenes.length);

  let ix = 0, score = 0, graded = false;
  const breakdown = [];

  function paint() {
    const sc = DATA.scenes[ix];
    graded = false;
    picEl.innerHTML = '<img src="' + sc.image + '" alt="' + BV.esc(sc.title) + '"' +
      (sc.fit === 'contain' ? ' class="contain"' : '') + '>';
    askHint.textContent = 'There are ' + sc.shows.length + ' of them hiding in these ' +
      (sc.shows.length + sc.absent.length) + ' words.';
    bankEl.innerHTML = BV.shuffle(sc.shows.concat(sc.absent)).map(v =>
      '<button type="button" class="val" data-v="' + BV.esc(v) + '">' + BV.esc(v) + '</button>').join('');
    tallyEl.textContent = '0 of ' + sc.shows.length + ' ticked';
    afterEl.hidden = true;
    submitBtn.textContent = 'Submit';
    submitBtn.disabled = false;
    rail.now(ix);
  }

  bankEl.addEventListener('click', ev => {
    const b = ev.target.closest('.val');
    if (!b || graded) return;
    b.classList.toggle('on');
    const n = bankEl.querySelectorAll('.val.on').length;
    tallyEl.textContent = n + ' of ' + DATA.scenes[ix].shows.length + ' ticked';
    BV.sfx.tick();
  });

  function grade() {
    const sc = DATA.scenes[ix];
    graded = true;
    let hits = 0, slips = 0;

    bankEl.querySelectorAll('.val').forEach(b => {
      const v = b.dataset.v;
      const real = sc.shows.indexOf(v) !== -1;
      const picked = b.classList.contains('on');
      b.classList.remove('on');
      b.disabled = true;
      if (picked && real) { b.classList.add('hit'); hits++; }
      else if (picked && !real) { b.classList.add('slip'); slips++; }
      else if (!picked && real) { b.classList.add('missed'); }
    });

    const got = Math.max(0, hits * PER - slips * COST);
    score += got;
    BV.setScore(score);

    tallyEl.textContent = hits + ' of ' + sc.shows.length + ' found' +
      (slips ? ', ' + slips + ' that were not there' : '') + ' · +' + got;

    afterEl.hidden = false;
    afterEl.textContent = sc.after || '';

    rail.mark(ix, hits === sc.shows.length && !slips ? 'done' : hits ? 'done' : 'miss');
    breakdown.push({
      label: sc.title,
      value: hits + '/' + sc.shows.length + (slips ? ' · −' + slips : '') + ' · +' + got,
      ok: hits === sc.shows.length && slips === 0
    });

    if (hits === sc.shows.length && !slips) { BV.sfx.good(); BV.toast('Every one, and nothing extra', 'good'); }
    else { BV.sfx.bad(); }

    BV.timer.stop();   // pause between rounds
    submitBtn.textContent = ix + 1 >= DATA.scenes.length ? 'See your score' : 'Next picture';
  }

  submitBtn.onclick = function () {
    if (!graded) {
      if (!bankEl.querySelectorAll('.val.on').length) { BV.toast('Tick at least one value', 'bad'); return; }
      grade();
      return;
    }
    ix++;
    if (ix >= DATA.scenes.length) {
      const clean = breakdown.filter(b => b.ok).length;
      return BV.finish({
        score, maxScore: MAX,
        headline: score === MAX ? 'You saw all of it' : 'Pictures finished',
        sub: clean + ' of ' + DATA.scenes.length + ' pictures read perfectly',
        breakdown, meta: { clean }
      });
    }
    BV.timer.start();   // clock was paused while the answer was shown
    paint();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startBtn = document.getElementById('startBtn');
  startBtn.onclick = function () {
    startBtn.disabled = true;
    startBtn.textContent = 'Loading pictures…';
    BV.preloadImages(DATA.scenes.map(sc => sc.image)).then(() => {
      document.getElementById('start').hidden = true;
      document.getElementById('play').hidden = false;
      paint();
      BV.timer.start();
    });
  };
})();
