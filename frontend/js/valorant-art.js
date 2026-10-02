/* Local sprite animation. Every cut uses original-image coordinates so the
 * same mask stays aligned at desktop and mobile sizes. Original PNGs are intact. */
(function () {
  'use strict';

  var SMILE = 'assets/valorant/clove-smile-v1.png';
  var BUTTERFLY = '<rect x="712" y="248" width="139" height="172"/>';
  var LEFT_BLADE = '<path d="M718 278H751L812 356V421H770L718 341Z"/>';
  var RIGHT_BLADE = '<rect x="1100" y="349" width="85" height="133"/>';
  var FACE = '<path d="M470 224L528 178L552 187L561 194L597 186L622 211L636 190L655 192L651 231L643 245L610 272L586 298L559 312L516 310L495 299L477 281L467 260Z"/>';

  function picture(src, width, height, attributes) {
    return '<image href="' + src + '" x="0" y="0" width="' + width + '" height="' + height + '" ' + (attributes || '') + '/>';
  }

  function render(src, index) {
    if (index === 0) {
      var clove = picture(src, 1369, 1149);
      return '<button class="valorant-character valorant-character--clove" type="button" data-clove-expression aria-label="点击暮蝶，切换微笑表情" aria-pressed="false">' +
        '<svg class="valorant-character-art valorant-sprite" viewBox="0 0 1369 1113" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
          '<defs>' +
            '<clipPath id="clove-butterfly-cut">' + BUTTERFLY + '</clipPath>' +
            '<clipPath id="clove-face-cut">' + FACE + '</clipPath>' +
            '<mask id="clove-body-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1369" height="1149" style="mask-type:luminance">' +
              '<rect width="1369" height="1149" fill="white"/><g fill="black">' + BUTTERFLY + '</g>' +
            '</mask>' +
          '</defs>' +
          '<g mask="url(#clove-body-mask)">' + clove + '</g>' +
          '<g class="clove-expression" clip-path="url(#clove-face-cut)">' + picture(SMILE, 1369, 1149) + '</g>' +
          '<g class="clove-butterfly-flight"><g class="clove-butterfly-flap"><g clip-path="url(#clove-butterfly-cut)">' + clove + '</g></g></g>' +
        '</svg></button>';
    }

    var jett = picture(src, 1448, 1086);
    return '<div class="valorant-character valorant-character--jett" role="img" aria-label="捷风像素立绘，飞镖轻轻悬浮，刀光流动">' +
      '<svg class="valorant-character-art valorant-sprite" viewBox="0 0 1448 1069" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
        '<defs>' +
          '<clipPath id="jett-blade-left-cut">' + LEFT_BLADE + '</clipPath>' +
          '<clipPath id="jett-blade-right-cut">' + RIGHT_BLADE + '</clipPath>' +
          '<mask id="jett-body-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1448" height="1086" style="mask-type:luminance">' +
            '<rect width="1448" height="1086" fill="white"/><g fill="black">' + LEFT_BLADE + RIGHT_BLADE + '</g>' +
          '</mask>' +
          '<filter id="jett-cyan-filter" color-interpolation-filters="sRGB">' +
            '<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -2 1 1 0 0"/>' +
            '<feComposite in2="SourceAlpha" operator="in"/>' +
          '</filter>' +
          '<mask id="jett-water-mask" maskUnits="userSpaceOnUse" x="485" y="645" width="350" height="330" style="mask-type:alpha">' +
            picture(src, 1448, 1086, 'filter="url(#jett-cyan-filter)"') +
          '</mask>' +
          '<linearGradient id="jett-water-sheen"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".5" stop-color="#e7ffff" stop-opacity=".7"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>' +
        '</defs>' +
        '<g mask="url(#jett-body-mask)">' + jett + '</g>' +
        '<g class="jett-blade-float jett-blade-float--left"><g clip-path="url(#jett-blade-left-cut)">' + jett + '</g></g>' +
        '<g class="jett-blade-float jett-blade-float--right"><g clip-path="url(#jett-blade-right-cut)">' + jett + '</g></g>' +
        '<g class="jett-water-light" mask="url(#jett-water-mask)"><rect class="jett-water-sweep" x="330" y="645" width="150" height="330" fill="url(#jett-water-sheen)"/></g>' +
      '</svg></div>';
  }

  function init(container) {
    var button = container.querySelector('[data-clove-expression]');
    if (!button) return;
    var expression = new Image();
    expression.src = SMILE;
    var ready = expression.decode().then(function () { return true; }, function () { return false; });
    button.addEventListener('click', function () {
      ready.then(function (loaded) {
        if (!loaded) return;
        var smiling = button.classList.toggle('is-smiling');
        button.setAttribute('aria-pressed', String(smiling));
        button.setAttribute('aria-label', smiling ? '暮蝶正在微笑，点击恢复原表情' : '点击暮蝶，切换微笑表情');
      });
    });
  }

  window.NJAUEC_VALORANT_ART = { render: render, init: init };
})();
