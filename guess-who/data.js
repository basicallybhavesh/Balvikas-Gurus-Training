/* =======================================================================
   Guess Who? — content

   The picture opens with just a quarter of the face showing. The cover
   slides away second by second and the points fall as it goes.

   name   the answer
   img    a face, cropped square. 600 x 600 or better looks sharpest.
   clue   appears once the face is about half uncovered
   after  the fact shown once the round is over
   ======================================================================= */

window.GUESSWHO = {
  seconds: 14,
  high: 400,
  low: 100,
  decoys: [
    'Arjuna Ranatunga', 'Aravinda de Silva', 'Chaminda Vaas', 'Mahela Jayawardene',
    'Lasith Malinga', 'Tillakaratne Dilshan', 'Angelo Mathews', 'Marvan Atapattu'
  ],
  people: [
    { name: 'Muttiah Muralitharan',
      img: '/assets/img/muralitharan.jpg',
      clue: 'His bowling action was questioned, tested, and cleared.',
      after: 'Eight hundred Test wickets, more than anyone has ever taken. A Kandy boy who spun the ball both ways off the same hand.' },

    { name: 'Kumar Sangakkara',
      img: '/assets/img/sangakkara.png',
      clue: 'A law student who ended up keeping wicket and opening the batting.',
      after: 'More than twenty-eight thousand international runs, and four hundreds in four consecutive World Cup innings in 2015.' },

    { name: 'Sanath Jayasuriya',
      img: '/assets/img/jayasuriya.png',
      clue: 'In 1996 he made the first fifteen overs a completely different game.',
      after: 'Player of the Tournament at the 1996 World Cup. Opening batsmen have attacked the new ball ever since because of him.' }
  ]
};
