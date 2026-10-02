/* Naraka accents: coordinates follow the untouched source PNGs. */
(function () {
  'use strict';

  const petal = '<path d="M-12 0v-12H0v-6h12v6h6V0H12v12H0V6h-12Z" fill="currentColor"/>';
  const spark = '<path d="M-5-23H5v18h18V5H5v18H-5V5h-18V-5h18Z" fill="currentColor"/>';
  const petals = [
    [635, 352, -155, -105, -350, 190, -170, '#ff7191', 0],
    [660, 368, -55, -175, -420, 385, 180, '#ffd6dd', 65],
    [620, 390, -265, -95, -470, 440, -210, '#fa819e', 110],
    [670, 355, 62, -25, 28, 360, 200, '#ffc1ca', 40],
    [640, 377, -350, 40, -350, 485, 150, '#ffb69c', 180],
    [661, 390, 46, 115, -35, 470, -190, '#ff6f96', 150]
  ].map(([x, y, mx, my, ex, ey, r, color, delay]) =>
    `<g transform="translate(${x} ${y})"><g class="nf-petal" style="--nf-mx:${mx}px;--nf-my:${my}px;--nf-ex:${ex}px;--nf-ey:${ey}px;--nf-turn:${r}deg;--nf-delay:${delay}ms;color:${color}">${petal}</g></g>`
  ).join('');

  const jewelPoints = [[466, 48], [274, 194], [710, 228], [151, 331], [800, 393], [355, 772]];
  const jewels = jewelPoints.map(([x, y], i) =>
    `<g transform="translate(${x} ${y})"><g class="nf-jewel" style="--nf-delay:${i * 75}ms">${spark}</g></g>`
  ).join('');

  const talismans = [[98, 790, -26, -225], [838, 785, 28, -258], [176, 914, -44, -300], [789, 929, 37, -298]].map(([x, y, dx, dy], i) =>
    `<g transform="translate(${x} ${y})"><g class="nf-talisman" style="--nf-dx:${dx}px;--nf-dy:${dy}px;--nf-delay:${i * 100}ms"><path d="M-12-23H12V23H-12Z" fill="#ffdc77" stroke="#ba7920" stroke-width="4"/><path d="M-6-11H6M0-15V12M-7 2H7M-6 14H6" fill="none" stroke="#9b5c19" stroke-width="4"/></g></g>`
  ).join('');

  window.NJAUEC_DIVISION_FX.register('naraka', [
    {
      label: '让头饰花瓣飞舞', duration: 1200, hintDuration: 660,
      markup: `<g class="nf-hint" aria-hidden="true">
          <path class="nf-lens nf-lens-a" pathLength="100" d="M178 202 211 168 242 152 274 149 309 164" fill="none" stroke="#fff1b0" stroke-width="11"/>
          <path class="nf-lens nf-lens-b" pathLength="100" d="M453 167 484 162 515 171 547 184 560 211" fill="none" stroke="#fff5c6" stroke-width="11"/>
        </g>
        <g class="nf-click nf-petals" aria-hidden="true">${petals}
          <g transform="translate(663 360)"><g class="nf-flower-spark" style="color:#fff5da">${spark}</g></g>
        </g>`
    },
    {
      label: '触发兵器交锋与振刀', duration: 900, hintDuration: 600,
      markup: `<g class="nf-hint" aria-hidden="true">
          <path class="nf-weapon-hint" pathLength="100" d="M66 471 172 429 278 364M540 220 628 170" fill="none" stroke="#b5f6ff" stroke-width="8"/>
        </g>
        <g class="nf-click" aria-hidden="true">
          <path class="nf-attack nf-attack-halo" pathLength="100" d="M530 452Q558 463 595 498L660 551" fill="none" stroke="#f7aa46" stroke-width="26"/>
          <path class="nf-attack nf-attack-core" pathLength="100" d="M530 452Q558 463 595 498L660 551" fill="none" stroke="#fff9d9" stroke-width="9"/>
          <path class="nf-parry nf-parry-halo" pathLength="100" d="M615 444Q534 509 549 609" fill="none" stroke="#32bcec" stroke-width="28"/>
          <path class="nf-parry nf-parry-core" pathLength="100" d="M615 444Q534 509 549 609" fill="none" stroke="#e9ffff" stroke-width="9"/>
          <g transform="translate(578 497)">
            <g class="nf-impact" style="color:#ffffdc">${spark}</g>
            <rect class="nf-ember" x="-7" y="-7" width="14" height="14" fill="#ffcd62" style="--nf-dx:-93px;--nf-dy:-58px;--nf-delay:0ms"/>
            <rect class="nf-ember" x="-6" y="-6" width="12" height="12" fill="#fff2b1" style="--nf-dx:82px;--nf-dy:-90px;--nf-delay:20ms"/>
            <rect class="nf-ember" x="-6" y="-6" width="12" height="12" fill="#77e9ff" style="--nf-dx:98px;--nf-dy:38px;--nf-delay:5ms"/>
            <rect class="nf-ember" x="-5" y="-5" width="10" height="10" fill="#79daff" style="--nf-dx:-70px;--nf-dy:82px;--nf-delay:40ms"/>
          </g>
        </g>`
    },
    {
      label: '展开金色阵纹', duration: 1450, hintDuration: 760,
      markup: `<g class="nf-hint" aria-hidden="true">${jewels}</g>
        <g class="nf-click" aria-hidden="true">
          <g class="nf-seal"><path d="M203 954 305 923H659L761 954 659 985H305Z" fill="none" stroke="#dca834" stroke-width="8"/>
            <path d="M276 954 350 936H614L688 954 614 972H350Z" fill="none" stroke="#ffe3a0" stroke-width="6"/>
            <path d="M217 954H257M707 954H747M322 932 339 942M625 969 642 978M322 978 339 967M625 941 642 931" fill="none" stroke="#fff1c9" stroke-width="7"/>
          </g>${talismans}
          <g transform="translate(466 48)"><g class="nf-crown-spark" style="color:#fff0ad">${spark}</g></g>
        </g>`
    }
  ]);
}());
