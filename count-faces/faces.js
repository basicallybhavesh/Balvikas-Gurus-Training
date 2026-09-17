/* =======================================================================
   The face factory.
   Each face is a small inline SVG: a pastel disc with a darker rim and
   one of five expressions. Only "happy" has an open smile, so the thing
   being counted stays unambiguous even at a glance.
   ======================================================================= */
(function (global) {
  'use strict';

  const SKINS = [
    { fill: '#F9D0DC', rim: '#E17F9E' },  // pink
    { fill: '#FBE08A', rim: '#DFAE2E' },  // yellow
    { fill: '#FBC79B', rim: '#E0904F' },  // orange
    { fill: '#C3E2FA', rim: '#6FAFE2' },  // blue
    { fill: '#D7CDFB', rim: '#9A86E4' },  // violet
    { fill: '#BFE9C9', rim: '#68B981' }   // green
  ];

  const INK = '#2E3040';
  const RED = '#E0495F';
  const BLUSH = 'rgba(224,73,95,.22)';

  const pick = a => a[Math.floor(Math.random() * a.length)];

  function glasses() {
    return '<g fill="none" stroke="' + INK + '" stroke-width="3">' +
      '<circle cx="37" cy="44" r="11"/><circle cx="63" cy="44" r="11"/>' +
      '<path d="M48 44h4"/><path d="M26 42l-8-3"/><path d="M74 42l8-3"/></g>';
  }

  function hair() {
    return '<path d="M20 34 Q34 6 62 13 Q46 19 36 34 Z" fill="#5B8FE8"/>';
  }

  function blush() {
    return '<ellipse cx="24" cy="56" rx="8" ry="5" fill="' + BLUSH + '"/>' +
           '<ellipse cx="76" cy="56" rx="8" ry="5" fill="' + BLUSH + '"/>';
  }

  /* ---- the five expressions ---- */

  const FACE = {
    /* the only one with an open smile */
    happy() {
      return '<g fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round">' +
        '<path d="M28 44 Q37 34 46 44"/><path d="M54 44 Q63 34 72 44"/></g>' +
        '<path d="M31 57 Q50 82 69 57 Z" fill="' + INK + '"/>' +
        '<path d="M40 69 Q50 79 60 69 Z" fill="' + RED + '"/>';
    },
    angry() {
      return '<g stroke="' + RED + '" stroke-width="4" stroke-linecap="round" fill="none">' +
        '<path d="M26 36 L44 44"/><path d="M26 48 L44 40"/>' +
        '<path d="M74 36 L56 44"/><path d="M74 48 L56 40"/>' +
        '<path d="M34 66 L42 61 L50 66 L58 61 L66 66"/></g>' + blush();
    },
    sad() {
      return '<g fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round">' +
        '<path d="M28 40 Q37 50 46 42"/><path d="M54 42 Q63 50 72 40"/>' +
        '<path d="M36 68 Q50 60 64 68"/></g>' +
        '<path d="M66 50 q4 8 0 10 q-4 -2 0 -10 Z" fill="#5BA9E8"/>';
    },
    surprised() {
      return '<g fill="#FFFFFF" stroke="' + INK + '" stroke-width="3">' +
        '<circle cx="37" cy="42" r="9"/><circle cx="63" cy="42" r="9"/></g>' +
        '<circle cx="37" cy="43" r="4" fill="' + INK + '"/>' +
        '<circle cx="63" cy="43" r="4" fill="' + INK + '"/>' +
        '<ellipse cx="50" cy="68" rx="9" ry="11" fill="' + RED + '"/>' + blush();
    },
    flat() {
      return '<g fill="' + INK + '"><circle cx="37" cy="43" r="4.5"/><circle cx="63" cy="43" r="4.5"/></g>' +
        '<path d="M34 66 H66" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
    }
  };

  const NOT_HAPPY = ['angry', 'sad', 'surprised', 'flat'];

  /* Builds one face. mood === 'happy' or anything from NOT_HAPPY. */
  global.makeFace = function (mood) {
    const skin = pick(SKINS);
    const extras =
      (Math.random() < 0.26 ? glasses() : '') +
      (Math.random() < 0.14 ? hair() : '');
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="46" fill="' + skin.fill + '" stroke="' + skin.rim + '" stroke-width="5"/>' +
      FACE[mood]() + extras + '</svg>';
  };

  global.NOT_HAPPY_MOODS = NOT_HAPPY;
})(window);
