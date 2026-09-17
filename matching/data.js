/* =======================================================================
   Shrines and Locations — content

   Each row shows a place (and a photo where there is one). The chip the
   player drags is the shrine that stands there.

   label  — the draggable chip
   answer — the row it belongs to
   img    — optional photo; 1200 x 800 landscape looks best
   icon   — used instead of a photo when there is no image
   ======================================================================= */

window.MATCHING = {
  intro: 'Drag a shrine onto the place it stands in. On a phone you can also tap the shrine, then tap its box.',
  rounds: [

    {
      title: 'Four you have seen',
      note: 'The photograph is there to help you.',
      items: [
        { label: 'Sri Dalada Maligawa',     answer: 'Kandy',              img: '/assets/img/dalada-maligawa.jpg' },
        { label: 'Kataragama Devalaya',     answer: 'Kataragama',         img: '/assets/img/kataragama.jpg' },
        { label: 'Sri Pada',                answer: 'Ratnapura District', img: '/assets/img/sri-pada.jpg' },
        { label: 'Nallur Kandaswamy Kovil', answer: 'Jaffna',             img: '/assets/img/nallur.jpg' }
      ]
    },

    {
      title: 'No photographs now',
      note: 'Five more, from memory alone.',
      items: [
        { label: 'Ruwanwelisaya',       answer: 'Anuradhapura', icon: '\u{1F54C}' },
        { label: 'Gangaramaya Temple',  answer: 'Colombo',      icon: '\u{1F6D5}' },
        { label: 'Dambulla Cave Temple',answer: 'Dambulla',     icon: '\u26F0\uFE0F' },
        { label: 'Koneswaram Kovil',    answer: 'Trincomalee',  icon: '\u{1F30A}' },
        { label: 'Munneswaram Temple',  answer: 'Chilaw',       icon: '\u{1FAB7}' }
      ]
    },

    // {
    //   title: 'Across every faith',
    //   note: 'The island keeps more than one kind of shrine.',
    //   items: [
    //     { label: 'Seetha Amman Temple',            answer: 'Nuwara Eliya',        icon: '\u{1F33F}' },
    //     { label: 'Basilica of Our Lady of Madhu',  answer: 'Mannar District',     icon: '\u26EA' },
    //     { label: 'Jami Ul-Alfar Mosque',           answer: 'Pettah, Colombo',     icon: '\u{1F54C}' },
    //     { label: 'Kelaniya Raja Maha Vihara',      answer: 'Kelaniya',            icon: '\u{1F3EF}' },
    //     { label: 'Mihintale',                      answer: 'Anuradhapura District', icon: '\u{1FAA8}' }
    //   ]
    // }

  ]
};
