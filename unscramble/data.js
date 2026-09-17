/* =======================================================================
   Unscramble the Hidden Word — content

   word    capitals, letters only
   clue    read before the letters appear
   pair    shown once the word is solved (the Sanskrit or English twin)
   seconds optional; falls back to the default below
   ======================================================================= */

window.UNSCRAMBLE = {
  seconds: 45,
  words: [
    { word: 'LOVE',          pair: 'Prema',   clue: 'The one value that asks for nothing in return.' },
    { word: 'TRUTH',         pair: 'Sathya',  clue: 'What stays the same whether or not anyone is watching.' },
    { word: 'PEACE',         pair: 'Shanti',  clue: 'Not the absence of noise, but the stillness underneath it.' },
    { word: 'PREMA',         pair: 'Love',    clue: 'Sanskrit. Not attachment, not liking \u2014 the love that expands.' },
    { word: 'SATHYA',        pair: 'Truth',   clue: 'Sanskrit. The first of the five, and the one the rest stand on.' },
    { word: 'SHANTI',        pair: 'Peace',   clue: 'Sanskrit. Chanted three times at the close of every prayer.' },
    { word: 'AHIMSA',        pair: 'Non violence', clue: 'Sanskrit. Hurting no creature in thought, word or deed.' },
    { word: 'DHARMA',        pair: 'Righteousness', clue: 'Sanskrit. The duty that is actually yours, done properly.' },
    { word: 'NONVIOLENCE',   pair: 'Ahimsa',  clue: 'Eleven letters. It begins where the wish to retaliate ends.' },
    { word: 'RIGHTEOUSNESS', pair: 'Dharma',  clue: 'Thirteen letters. Doing the right thing even when it costs you.' }
  ]
};
