/* Overwatch illustration effects. All SVG coordinates follow the original PNGs. */
(function () {
  'use strict';

  var hub = window.NJAUEC_DIVISION_FX;
  if (!hub) return;

  // Blade: (795, 556) -> (50, 768) in the 1774 x 887 Genji image.
  var genji = {
    label: '源氏，点击释放龙刃刀光',
    duration: 550,
    hintDuration: 700,
    markup: '<g class="owf-genji-hint" fill="none" stroke-linecap="square">' +
      '<path class="owf-blade-charge" pathLength="100" d="M790 558L731 577L670 595L606 615L541 633L480 651L421 673L356 692L295 711L233 731L165 750L58 769" stroke="#f5ffbd" stroke-width="15"/>' +
      '</g>' +
      '<g class="owf-genji-slash" fill="none" stroke-linecap="square" stroke-linejoin="miter">' +
      '<path class="owf-blade-trail" pathLength="100" d="M805 530L704 552L598 578L493 610L387 642L280 680L171 724L40 765" stroke="#91e834" stroke-width="36"/>' +
      '<path class="owf-blade-core" pathLength="100" d="M801 548L737 570L672 590L607 611L541 631L476 650L410 675L346 695L281 716L214 737L150 757L52 769" stroke="#f4ffd2" stroke-width="13"/>' +
      '<path class="owf-blade-echo" pathLength="100" d="M698 519L600 542L496 568L394 601L292 638L182 681L83 726" stroke="#b5f961" stroke-width="8"/>' +
      '</g>' +
      '<g class="owf-genji-pixels" fill="#d5ff93" shape-rendering="crispEdges">' +
      '<rect x="506" y="562" width="15" height="15"/><rect x="345" y="619" width="12" height="12"/>' +
      '<rect x="230" y="683" width="18" height="18"/><rect x="98" y="717" width="12" height="12"/>' +
      '</g>'
  };

  // Muzzle: (88, 486); keep the flash and reload indicator inside the 1536 x 1024 image.
  var mccree = {
    label: '麦克雷，点击射击，六发后换弹',
    duration: 360,
    hintDuration: 600,
    markup: '<g class="owf-aim" fill="none" stroke="#ddaf60" stroke-width="7" stroke-linecap="square">' +
      '<path d="M28 456H16V468M58 456H70V468M28 516H16V504M58 516H70V504"/>' +
      '<path d="M36 486H50M43 479V493" stroke-width="5"/>' +
      '</g>' +
      '<g class="owf-muzzle" shape-rendering="crispEdges">' +
      '<path d="M96 479H77V466H62V449H48V465H32V477H7V494H30V505H48V522H64V506H78V495H96Z" fill="#ffad38"/>' +
      '<path d="M94 482H67V474H52V482H25V491H52V500H66V491H94Z" fill="#fff8ce"/>' +
      '</g>' +
      '<g class="owf-shot-pixels" fill="#e8b54e" shape-rendering="crispEdges">' +
      '<rect x="31" y="436" width="10" height="10"/><rect x="19" y="527" width="8" height="8"/>' +
      '</g>' +
      '<g class="owf-reload" transform="translate(258 345)">' +
      '<g class="owf-cylinder">' +
      '<circle r="71" fill="#f9efd8" fill-opacity=".94" stroke="#875e38" stroke-width="8"/>' +
      '<circle r="12" fill="#875e38"/>' +
      '<g fill="#5d493a" stroke="#d7bb7c" stroke-width="4">' +
      '<circle class="owf-chamber owf-chamber-1" cx="0" cy="-43" r="12"/>' +
      '<circle class="owf-chamber owf-chamber-2" cx="37" cy="-21.5" r="12"/>' +
      '<circle class="owf-chamber owf-chamber-3" cx="37" cy="21.5" r="12"/>' +
      '<circle class="owf-chamber owf-chamber-4" cx="0" cy="43" r="12"/>' +
      '<circle class="owf-chamber owf-chamber-5" cx="-37" cy="21.5" r="12"/>' +
      '<circle class="owf-chamber owf-chamber-6" cx="-37" cy="-21.5" r="12"/>' +
      '</g></g></g>',
    onActivate: function (ctx) {
      ctx.state.shots = (ctx.state.shots || 0) + 1;
      if (ctx.state.shots === 6) {
        ctx.state.shots = 0;
        ctx.slot.classList.add('owf-reloading');
        return ctx.reducedMotion ? 220 : 1200;
      }
      return ctx.reducedMotion ? 160 : 360;
    },
    onReset: function (ctx) {
      ctx.slot.classList.remove('owf-reloading');
    }
  };

  // Floating device cores: (316, 278) and (1056, 210), in the 1206 x 1304 image.
  var energy = {
    label: '守望先锋像素角色，点击释放能量脉冲',
    duration: 900,
    hintDuration: 850,
    markup: '<g class="owf-energy-hint" fill="none" stroke="#f1ffff" stroke-width="14" stroke-linecap="square">' +
      '<path class="owf-energy-flow" pathLength="100" d="M359 275L420 280L464 243L518 205L586 187L678 190L748 208L789 252L798 285"/>' +
      '<path class="owf-energy-flow owf-flow-right" pathLength="100" d="M1111 205L1160 225L1179 264L1176 308L1149 355L1111 397L1034 429L957 452L891 474"/>' +
      '</g>' +
      '<g class="owf-device owf-device-left" fill="none" stroke="#d5ffff" stroke-width="11" stroke-linecap="square">' +
      '<path d="M283 271H302V252H328V271H346V290H328V307H302V290H283Z"/>' +
      '<path d="M301 278H331M316 263V293" stroke="#ffffff"/>' +
      '</g>' +
      '<g class="owf-device owf-device-right" fill="none" stroke="#d5ffff" stroke-width="11" stroke-linecap="square">' +
      '<path d="M1025 203H1043V186H1069V203H1087V222H1069V239H1043V222H1025Z"/>' +
      '<path d="M1041 211H1071M1056 196V226" stroke="#ffffff"/>' +
      '</g>' +
      '<g fill="none" stroke-linecap="square" stroke-linejoin="miter">' +
      '<path class="owf-pulse owf-pulse-one" pathLength="100" d="M316 278L261 257L203 234L150 213L81 188" stroke="#9bf8eb" stroke-width="17"/>' +
      '<path class="owf-pulse owf-pulse-two" pathLength="100" d="M1056 210L1095 172L1132 131L1179 84" stroke="#9bf8eb" stroke-width="17"/>' +
      '<path class="owf-pulse owf-pulse-three" pathLength="100" d="M316 278L262 283L200 289L143 296L85 299" stroke="#e4fffc" stroke-width="12"/>' +
      '<path class="owf-energy-wave" d="M1056 120L1109 133L1145 169L1158 210L1145 251L1109 286L1056 300L1003 286L967 251L954 210L967 169L1003 133Z" stroke="#75e8de" stroke-width="12"/>' +
      '</g>' +
      '<g class="owf-energy-pixels" fill="#bcfff4" shape-rendering="crispEdges">' +
      '<rect x="109" y="207" width="13" height="13"/><rect x="1145" y="120" width="15" height="15"/>' +
      '<rect x="1148" y="244" width="13" height="13"/><rect x="963" y="154" width="10" height="10"/>' +
      '</g>'
  };

  hub.register('overwatch', [genji, mccree, energy]);
})();
