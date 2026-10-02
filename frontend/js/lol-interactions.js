/* LOL sprite effects use the source artwork's 768 x 1024 coordinates. */
(function () {
  'use strict';
  var fx = window.NJAUEC_DIVISION_FX;
  if (!fx) return;

  fx.register('lol', [
    {
      label: '千珏，点击切换表情并唤起灵火',
      duration: 1080,
      hintDuration: 750,
      markup: '<g class="lf-effects lf-kindred" fill="none" stroke-linejoin="miter">' +
        '<g class="lf-hint lf-kindred-hint" stroke="#ba91ff" stroke-width="9">' +
          '<path d="M104 595v18m-9-9h18M644 538v22m-11-11h22M666 698v20m-10-10h20"/>' +
          '<path d="M74 754l18-12 18 12-18 12zM623 790l17-13 17 13-17 13z" fill="#acf9ff" stroke="none"/>' +
        '</g>' +
        '<g class="lf-action lf-spirit lf-spirit-left">' +
          '<path d="M168 811l-39-8-31-27-17-39 8-41 24-33-2 35 19 20 3-43 20-29 0 43 26 40 9 40z" fill="#9176ed" opacity=".72"/>' +
          '<path d="M166 802l-33-14-14-28 6-29 12 15 7-37 10 37 17 21z" fill="#a4f7ff"/>' +
          '<path d="M140 814l-43 0-26-17-10-23" stroke="#c2fcff" stroke-width="9"/>' +
        '</g>' +
        '<g class="lf-action lf-spirit lf-spirit-right">' +
          '<path d="M596 811l37-12 28-30 15-40-9-38-27-31 6 35-16 24-7-42-22-29 3 45-24 40-7 41z" fill="#aa83ef" opacity=".72"/>' +
          '<path d="M598 800l31-16 12-28-8-29-10 17-10-36-7 38-15 21z" fill="#a4f7ff"/>' +
          '<path d="M621 814l43-3 24-20 8-20" stroke="#c2fcff" stroke-width="9"/>' +
        '</g>' +
        '<g class="lf-action lf-spirit-trail" stroke="#bfeaff" stroke-width="9">' +
          '<path d="M151 844l64 18 63-8M489 854l66 8 62-19"/>' +
          '<path d="M73 673l9 12-9 12-9-12zM686 649l10 13-10 13-10-13z" fill="#d5beff" stroke="none"/>' +
          '<path d="M47 748h13v13H47zM706 735h13v13h-13z" fill="#bbf9ff" stroke="none"/>' +
        '</g>' +
      '</g>'
    },
    {
      label: '格温，点击施展剪刀招式',
      duration: 820,
      hintDuration: 640,
      markup: '<g class="lf-effects lf-gwen" fill="none" stroke-linecap="square" stroke-linejoin="miter">' +
        '<g class="lf-hint lf-gwen-hint" fill="#e6ffff" stroke="#52d9ff" stroke-width="7">' +
          '<path d="M91 813l6-20 7 20 20 7-20 7-7 20-6-20-20-7z"/>' +
          '<path d="M206 723l6-18 6 18 18 6-18 6-6 18-6-18-18-6z"/>' +
        '</g>' +
        '<g class="lf-action lf-cut lf-cut-one">' +
          '<path class="lf-cut-border" d="M46 867l53-57 69-50 58-28M70 730l44 43 41 56 35 69"/>' +
          '<path class="lf-cut-core" d="M46 867l53-57 69-50 58-28M70 730l44 43 41 56 35 69"/>' +
        '</g>' +
        '<g class="lf-action lf-cut lf-cut-two">' +
          '<path class="lf-cut-border" d="M24 908l60-77 75-65 85-48M43 711l59 52 58 73 46 84"/>' +
          '<path class="lf-cut-core" d="M24 908l60-77 75-65 85-48M43 711l59 52 58 73 46 84"/>' +
          '<path d="M136 794l5-17 6 17 17 6-17 6-6 17-5-17-17-6z" fill="#f0ffff" stroke="none"/>' +
        '</g>' +
        '<g class="lf-action lf-thread lf-thread-left" stroke="#6bebff" stroke-width="9">' +
          '<path d="M63 798l-20-9 2-25M83 861l-23 5-9 15"/>' +
          '<path d="M36 836h12v12H36z" fill="#dcffff" stroke="none"/>' +
        '</g>' +
        '<g class="lf-action lf-thread lf-thread-right" stroke="#7e9dff" stroke-width="9">' +
          '<path d="M203 758l21-3 13 9M197 865l20 11 19-5"/>' +
          '<path d="M242 811h12v12h-12z" fill="#dcffff" stroke="none"/>' +
        '</g>' +
      '</g>'
    },
    {
      label: '亚索，点击唤起剑风',
      duration: 1280,
      hintDuration: 670,
      markup: '<g class="lf-effects lf-yasuo" fill="none" stroke-linecap="square" stroke-linejoin="miter">' +
        '<g class="lf-hint lf-yasuo-hint" stroke="#b8edf8" stroke-width="9">' +
          '<path d="M510 775l65 16 63 33M558 846l43 16 47 4"/>' +
        '</g>' +
        '<g class="lf-action lf-sword-wind">' +
          '<path d="M263 704l90 10 101 31 94 47 82 61 65 62" stroke="#56b7de" stroke-width="23"/>' +
          '<path d="M263 704l90 10 101 31 94 47 82 61 65 62" stroke="#e6fcff" stroke-width="9"/>' +
          '<path d="M350 749l74 20 80 37 67 49" stroke="#87d8ed" stroke-width="7"/>' +
        '</g>' +
        '<g class="lf-action lf-whirlwind">' +
          '<path d="M596 907l33 12 31-7-4-10-41-10-28-16 4-12 56-1 44-13 12-17-13-10-73-1-32-12 9-17 35-12 58-6 28-18-5-17-41-11-61 7" stroke="#58a6ca" stroke-width="18"/>' +
          '<path d="M598 904l30 11 29-6M596 867l51 0 43-13M608 823l70 2 23 7M598 792l31-11 58-6M652 738l41 4 19 9" stroke="#defaff" stroke-width="8"/>' +
          '<path class="lf-wind-sweep" d="M599 879l42 5 43-11M589 816l41-11 63 0M639 756l38-4 29 8" stroke="#b5efff" stroke-width="8"/>' +
        '</g>' +
        '<g class="lf-action lf-wind-scatter" stroke="#abe5ef" stroke-width="8">' +
          '<path d="M590 737l27-10M682 694l29 4M718 794l18-14M622 944l27-1"/>' +
        '</g>' +
      '</g>'
    }
  ]);
})();
