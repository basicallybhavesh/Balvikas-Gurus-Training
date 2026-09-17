(function () {
  'use strict';

  const DATA = window.MATCHING;
  const PER_MATCH = 100;
  const totalItems = DATA.rounds.reduce((n, r) => n + r.items.length, 0);

  BV.setup({
    slug: 'matching',
    title: 'Shrines and Locations',
    accent: 'peacock',
    maxScore: totalItems * PER_MATCH
  });

  const elStart = document.getElementById('start');
  const elPlay = document.getElementById('play');
  const tray = document.getElementById('tray');
  const rows = document.getElementById('rows');
  const checkBtn = document.getElementById('checkBtn');
  const rail = BV.rail(document.getElementById('rail'), DATA.rounds.length);
  document.getElementById('introText').textContent = DATA.intro;

  let roundIx = 0;
  let score = 0;
  const breakdown = [];

  function media(item) {
    if (item.img) return '<span class="media"><img src="' + item.img + '" alt="" loading="lazy"></span>';
    return '<span class="media">' + BV.esc(item.icon || '🕉️') + '</span>';
  }

  function renderRound() {
    const round = DATA.rounds[roundIx];
    document.getElementById('roundTitle').textContent = round.title;
    document.getElementById('roundNote').textContent = round.note || '';
    rail.now(roundIx);

    rows.innerHTML = round.items.map((it, i) =>
      '<div class="row" data-i="' + i + '">' +
        '<div class="slot" data-i="' + i + '"></div>' +
        media(it) +
        '<div class="who">' + BV.esc(it.answer) + '</div>' +
      '</div>').join('');

    tray.innerHTML = BV.shuffle(round.items.map((it, i) => ({ it, i })))
      .map(o => '<button type="button" class="chip" data-answer="' + o.i + '">' +
        BV.esc(o.it.label) + '</button>').join('');

    document.getElementById('board').dataset.locked = '0';
    checkBtn.disabled = false;
    checkBtn.textContent = 'Check answers';
  }

  function place(chip, slot) {
    if (!slot.classList.contains('slot')) return;
    const sitting = slot.querySelector('.chip');
    if (sitting === chip) return;
    if (sitting) tray.appendChild(sitting);
    slot.appendChild(chip);
    slot.classList.add('filled');
    if (sitting) sitting.blur();
    tidy();
    BV.sfx.tick();
  }

  function takeBack(slot) {
    const chip = slot.querySelector('.chip');
    if (!chip) return;
    tray.appendChild(chip);
    slot.classList.remove('filled');
    tidy();
  }

  function tidy() {
    rows.querySelectorAll('.slot').forEach(s => {
      s.classList.toggle('filled', !!s.querySelector('.chip'));
      s.classList.remove('over');
    });
  }

  /* One drag root wrapping both the tray and the rows, so a chip can be
     picked up in either place and dropped in either place. */
  const board = document.getElementById('board');
  BV.dnd(board, { onDrop: place, onTakeBack: takeBack });

  function grade() {
    const round = DATA.rounds[roundIx];
    let got = 0;
    rows.querySelectorAll('.row').forEach(row => {
      const i = Number(row.dataset.i);
      const slot = row.querySelector('.slot');
      const chip = slot.querySelector('.chip');
      const correct = chip && Number(chip.dataset.answer) === i;
      slot.classList.add(correct ? 'right' : 'wrong');
      row.classList.add('graded');
      if (correct) {
        got++;
      } else {
        const who = row.querySelector('.who');
        who.innerHTML = BV.esc(round.items[i].answer) +
          '<small>' + BV.esc(round.items[i].label) + '</small>';
      }
    });

    score += got * PER_MATCH;
    BV.setScore(score);
    breakdown.push({
      label: round.title,
      value: got + ' of ' + round.items.length,
      ok: got === round.items.length
    });
    rail.mark(roundIx, got === round.items.length ? 'done' : got ? 'done' : 'miss');

    if (got === round.items.length) { BV.sfx.good(); BV.toast('All ' + got + ' correct', 'good'); }
    else { BV.sfx.bad(); BV.toast(got + ' of ' + round.items.length + ' correct'); }

    BV.timer.stop();   // pause between rounds
    document.getElementById('board').dataset.locked = '1';
  }

  checkBtn.onclick = function () {
    if (document.getElementById('board').dataset.locked === '1') {
      roundIx++;
      if (roundIx >= DATA.rounds.length) return end();
      BV.timer.start();   // clock was paused while the answer was shown
      renderRound();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const empty = rows.querySelectorAll('.slot:not(.filled)').length;
    if (empty && !confirm(empty + ' box' + (empty === 1 ? ' is' : 'es are') + ' still empty. Check anyway?')) return;
    grade();
    checkBtn.textContent = roundIx + 1 >= DATA.rounds.length ? 'See your score' : 'Next round';
  };

  function end() {
    BV.finish({
      score,
      maxScore: totalItems * PER_MATCH,
      headline: score === totalItems * PER_MATCH ? 'Every single one' : 'Rounds finished',
      sub: Math.round(score / PER_MATCH) + ' of ' + totalItems + ' matches correct',
      breakdown,
      meta: { rounds: DATA.rounds.length }
    });
  }

  const startBtn = document.getElementById('startBtn');
  startBtn.onclick = function () {
    startBtn.disabled = true;
    startBtn.textContent = 'Loading pictures…';
    const images = DATA.rounds.flatMap(r => r.items.map(it => it.img));
    BV.preloadImages(images).then(() => {
      elStart.hidden = true;
      elPlay.hidden = false;
      renderRound();
      BV.timer.start();
    });
  };
})();
