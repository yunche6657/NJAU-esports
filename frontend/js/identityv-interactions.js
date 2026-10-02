/* Fifth-person storybook moments. Coordinates follow the unmodified source PNGs. */
(function () {
  'use strict';

  const hub = window.NJAUEC_DIVISION_FX;
  if (!hub) return;

  const spark = (x, y, color, delay, extra = '') => `
    <g transform="translate(${x} ${y})"><g class="ivf-bit ivf-spark ${extra}" style="--ivf-delay:${delay}ms" fill="${color}">
      <path d="M-6-27H6V-6H27V6H6V27H-6V6H-27V-6H-6Z"/>
      <path d="M-4-14H4V-4H14V4H4V14H-4V4H-14V-4H-4Z" fill="#fffbe2"/>
    </g></g>`;

  const butterfly = (extra) => `<g class="ivf-bit ivf-butterfly ${extra}">
    <g class="ivf-wing ivf-wing-left"><path d="M-5-6L-17-23H-35V-5L-21 5L-30 19H-14L-4 8Z" fill="#a5d878" stroke="#506c38" stroke-width="5" stroke-linejoin="miter"/><path d="M-29-16H-20V-8H-29Z" fill="#eff7ba"/></g>
    <g class="ivf-wing ivf-wing-right"><path d="M5-6L17-23H35V-5L21 5L30 19H14L4 8Z" fill="#cee99a" stroke="#506c38" stroke-width="5" stroke-linejoin="miter"/><path d="M20-16H29V-8H20Z" fill="#fffae0"/></g>
    <path d="M-4-15H4V18H-4ZM-4-15L-10-24M4-15L10-24" fill="#3e572c" stroke="#3e572c" stroke-width="4"/>
  </g>`;

  const leaf = (x, y, delay, dx, dy, rotate) => `<g transform="translate(${x} ${y})"><g class="ivf-bit ivf-leaf" style="--ivf-delay:${delay}ms;--ivf-dx:${dx}px;--ivf-dy:${dy}px;--ivf-turn:${rotate}deg">
    <path d="M-23 8L-18-11L0-23L24-24L19-4L0 13Z" fill="#9fbe57" stroke="#597733" stroke-width="4"/><path d="M-22 12L15-17" stroke="#e3eca3" stroke-width="4"/>
  </g></g>`;

  const glyph = (x, y, delay, dx) => `<g transform="translate(${x} ${y})"><g class="ivf-bit ivf-glyph" style="--ivf-delay:${delay}ms;--ivf-dx:${dx}px" fill="none" stroke="#b28a54" stroke-width="7" stroke-linecap="square">
    <path d="M-13-15H13M-8-3H8M-13 10H13M-13-15V10"/>
  </g></g>`;

  const flower = (x, y, delay, extra = '') => `<g transform="translate(${x} ${y})"><g class="ivf-bit ivf-flower ${extra}" style="--ivf-delay:${delay}ms" fill="#ffdda0" stroke="#cb8e47" stroke-width="4">
    <path d="M-9-12L-18-27L-6-37L8-31L10-12L29-19L40-8L33 7L15 9L20 26L9 38L-5 32L-10 15L-28 22L-39 10L-31-5L-13-4Z"/>
    <path d="M-10-10H10V10H-10Z" fill="#fff9cb" stroke="#d9a24b"/>
  </g></g>`;

  const petal = (x, y, delay, dx, dy, turn) => `<g transform="translate(${x} ${y})"><g class="ivf-bit ivf-petal" style="--ivf-delay:${delay}ms;--ivf-dx:${dx}px;--ivf-dy:${dy}px;--ivf-turn:${turn}deg">
    <path d="M-6-18H8L17-8V5L5 17L-8 10L-15-4Z" fill="#ffd490" stroke="#e3a85e" stroke-width="3"/>
    <path d="M-4-12H4V0H-4Z" fill="#fff3c7"/>
  </g></g>`;

  hub.register('identityv', [
    {
      label: '让绿蝶绕着帽檐飞一圈',
      duration: 1650,
      hintDuration: 760,
      markup: `
        <g transform="translate(667 175)">${butterfly('ivf-hat-butterfly ivf-reduced')}</g>
        ${leaf(671, 200, 160, -136, -115, -50)}
        ${leaf(520, 99, 310, -220, 32, 100)}
        ${leaf(210, 160, 520, -90, 105, -85)}
        ${leaf(154, 269, 680, 135, 23, 80)}
        ${spark(687, 213, '#e4ef9c', 160, 'ivf-hat-star')}
        ${spark(547, 79, '#cfdfa0', 310)}
        ${spark(102, 266, '#e4ef9c', 760)}
      `
    },
    {
      label: '点击相机拍照，闪光并播放快门声',
      duration: 950,
      hintDuration: 820,
      markup: `
        <g transform="translate(202 531)">
          <path class="ivf-bit ivf-camera-focus ivf-camera-reduced" d="M-78-62v-22h26M53-84h26v22M-78 52v22h26M53 74h26V52" fill="none" stroke="#fff0bd" stroke-width="7"/>
          <g class="ivf-bit ivf-camera-flash">
            <path d="M-18-25L0-115L18-25L98-73L34-8L121 12L33 28L75 100L8 45L-25 113L-27 29L-105 65L-47 9L-117-21L-34-18L-67-90Z" fill="#fff8d6" opacity=".9"/>
            <path d="M-16-30H15V-15H31V16H15V31H-16V16H-31V-15H-16Z" fill="#fff"/>
          </g>
          <circle class="ivf-bit ivf-camera-ring" r="43" fill="none" stroke="#ffdfa0" stroke-width="6"/>
        </g>
      `
    },
    {
      label: '让花朵绽放，蝴蝶沿辫子飞过',
      duration: 1850,
      hintDuration: 880,
      markup: `
        ${spark(242, 159, '#ffe3a1', 0, 'ivf-hair-star ivf-reduced')}
        ${spark(191, 283, '#cef1f1', 130, 'ivf-hair-star')}
        ${spark(324, 101, '#fff2c1', 270, 'ivf-hair-star')}
        ${spark(857, 499, '#ffe7ad', 480)}
        ${flower(161, 577, 30)}
        ${flower(739, 652, 170)}
        ${petal(693, 561, 210, 96, 221, 65)}
        ${petal(839, 470, 330, 93, 287, -110)}
        ${petal(925, 384, 500, 39, 291, 125)}
        ${petal(792, 600, 650, 81, 245, -70)}
        ${petal(702, 622, 770, 104, 237, 95)}
        <g transform="translate(758 682)">${butterfly('ivf-braid-butterfly')}</g>
      `
    }
  ]);
}());
