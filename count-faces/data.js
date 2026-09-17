/* =======================================================================
   Count the Happy Faces — content

   The crowd is drawn fresh every time, so the answer is never the same
   twice and nobody can memorise it from an earlier attempt.

   total    how many faces are on screen
   min/max  the range the happy ones are picked from
   seconds  how long the crowd stays visible
   drift    true makes the faces sway, which is harder to count
   ======================================================================= */

window.COUNTFACES = {
  rounds: [
    { total: 18, min: 4,  max: 8,  seconds: 6, drift: false },
    { total: 26, min: 6,  max: 11, seconds: 6, drift: false },
    { total: 34, min: 8,  max: 14, seconds: 5, drift: false },
    { total: 42, min: 10, max: 17, seconds: 5, drift: true  },
    { total: 50, min: 12, max: 20, seconds: 4, drift: true  },
    { total: 60, min: 14, max: 24, seconds: 4, drift: true  }
  ]
};
