/* =======================================================================
   One Pic, Many Values — content

   One picture, one bank of words. The player ticks every value the
   picture actually shows and leaves the rest alone.

   shows   — the values that are really there (each one earns points)
   absent  — plausible words that are not there (each one costs points)

   To add a picture: drop the file in /assets/img/ and copy a block below.
   Landscape photos look best at 1200 x 800 or wider.
   ======================================================================= */

window.PICVALUES = {
  perValue: 100,
  wrongCost: 50,
  scenes: [

    {
      title: 'The umbrella',
      image: '/assets/img/kindness-umbrella.png',
      fit: 'contain',
      shows:  ['Kindness', 'Compassion', 'Sharing', 'Concern for another', 'Selflessness'],
      absent: ['Ambition', 'Pride', 'Indifference', 'Competition', 'Obedience'],
      after: 'He keeps none of the umbrella for himself. Notice who is left standing in the rain.'
    },

    {
      title: 'Dawn at Sri Pada',
      image: '/assets/img/sri-pada.jpg',
      shows:  ['Reverence', 'Devotion', 'Endurance', 'Unity across faiths', 'Discipline'],
      absent: ['Haste', 'Display of wealth', 'Rivalry', 'Carelessness', 'Suspicion'],
      after: 'Buddhists, Hindus, Muslims and Christians climb the same steps to the same summit. The mountain has never asked anyone which way they pray.'
    },

    {
      title: 'The festival at Kataragama',
      image: '/assets/img/kataragama.jpg',
      shows:  ['Faith', 'Togetherness', 'Respect for tradition', 'Equality', 'Celebration'],
      absent: ['Solitude', 'Secrecy', 'Impatience', 'Doubt', 'Thrift'],
      after: 'Kataragama has drawn Sinhala, Tamil, Muslim and Vedda pilgrims for centuries. Nobody is asked their name at the gate.'
    }

  ]
};
