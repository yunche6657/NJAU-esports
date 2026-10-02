/* Shared, finite sprite effects. Artwork is never cut up or repainted. */
(function () {
  'use strict';
  var definitions = Object.create(null);
  var instances = [];
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var started = false;

  function mount(card, original, def, index, id) {
    if (original.hasAttribute('data-division-fx')) return;
    var slot = original;
    if (slot.tagName !== 'BUTTON') {
      slot = document.createElement('button');
      Array.prototype.forEach.call(original.attributes, function (a) { slot.setAttribute(a.name, a.value); });
      while (original.firstChild) slot.appendChild(original.firstChild);
      original.replaceWith(slot);
    }
    var img = slot.querySelector('.game-character-art');
    if (!img) return;
    slot.type = 'button';
    slot.classList.add('division-fx-slot');
    slot.setAttribute('data-division-fx', '');
    slot.setAttribute('data-fx-index', index);
    if (!slot.hasAttribute('data-lol-kindred')) slot.setAttribute('aria-label', def.label);
    img.draggable = false;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('division-fx-layer');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    // Markup comes exclusively from the four local, reviewed effect modules.
    svg.innerHTML = def.markup || '';
    slot.appendChild(svg);
    var ctx = { slot: slot, image: img, svg: svg, state: {}, reducedMotion: motion.matches };
    var sound = window.NJAUEC_DIVISION_SOUND;
    if (sound) sound.prepare(id, index);
    var activeTimer = 0;
    var hintTimer = 0;
    var busy = false;
    var visible = true;

    function align() {
      if (!img.naturalWidth || !img.naturalHeight) return;
      var box = img.getBoundingClientRect();
      var parent = slot.getBoundingClientRect();
      if (!box.width || !box.height || !parent.width || !parent.height) return;
      // Existing images use object-fit:contain, center bottom. Their bounding
      // boxes already include per-character scale/translation in sections.css.
      var ratio = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
      var width = img.naturalWidth * ratio;
      var height = img.naturalHeight * ratio;
      var scaleX = parent.width / slot.offsetWidth;
      var scaleY = parent.height / slot.offsetHeight;
      svg.setAttribute('viewBox', '0 0 ' + img.naturalWidth + ' ' + img.naturalHeight);
      svg.style.left = ((box.left + (box.width - width) / 2 - parent.left) / scaleX) + 'px';
      svg.style.top = ((box.bottom - height - parent.top) / scaleY) + 'px';
      svg.style.width = (width / scaleX) + 'px';
      svg.style.height = (height / scaleY) + 'px';
    }
    function endHint() {
      clearTimeout(hintTimer);
      slot.classList.remove('is-fx-hint');
    }
    function reset(stopAudio) {
      if (stopAudio === true && sound) sound.stop(slot);
      clearTimeout(activeTimer);
      endHint();
      busy = false;
      slot.classList.remove('is-fx-active');
      slot.removeAttribute('aria-busy');
      if (def.onReset) def.onReset(ctx);
    }
    function hint() {
      if (busy || !visible || document.hidden || ctx.reducedMotion) return;
      endHint();
      align();
      if (def.onHint) def.onHint(ctx);
      slot.classList.add('is-fx-hint');
      hintTimer = setTimeout(endHint, def.hintDuration || 700);
    }
    function activate(event) {
      if (busy || !visible || document.hidden || !img.naturalWidth) {
        // Also keep the existing Kindred expression handler from toggling
        // repeatedly during a single effect, without replacing that handler.
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      endHint();
      align();
      busy = true;
      slot.setAttribute('aria-busy', 'true');
      var duration = def.duration || 1000;
      if (def.onActivate) duration = def.onActivate(ctx) || duration;
      slot.classList.add('is-fx-active');
      if (sound) sound.play(id, index, ctx);
      // No queued animations, and no timers kept running when offscreen.
      activeTimer = setTimeout(reset, ctx.reducedMotion ? Math.min(duration, 280) : duration);
    }
    slot.addEventListener('click', activate, true);
    slot.addEventListener('pointerenter', function (event) { if (event.pointerType !== 'touch') hint(); });
    slot.addEventListener('pointerleave', endHint);
    slot.addEventListener('focus', function () { if (slot.matches(':focus-visible')) hint(); });
    slot.addEventListener('blur', endHint);
    img.addEventListener('load', align);
    if ('ResizeObserver' in window) {
      var resize = new ResizeObserver(align);
      resize.observe(slot);
      resize.observe(img);
    }
    if ('IntersectionObserver' in window) {
      var intersection = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (!visible) reset(true);
        else align();
      });
      intersection.observe(slot);
    }
    align();
    instances.push({ reset: reset, align: align, ctx: ctx });
  }

  window.NJAUEC_DIVISION_FX = {
    register: function (id, effects) { definitions[id] = effects; },
    init: function (root) {
      // A reversible visual comparison switch; no cookies or storage needed.
      if (started || new URLSearchParams(location.search).get('divisionFx') === 'off') return;
      started = true;
      Object.keys(definitions).forEach(function (id) {
        var card = root.querySelector('.game-card--' + id);
        if (!card) return;
        card.classList.add('has-division-fx');
        var slots = card.querySelectorAll('.game-character-slot--filled');
        definitions[id].forEach(function (def, index) {
          if (slots[index]) mount(card, slots[index], def, index, id);
        });
      });
      window.addEventListener('resize', function () { instances.forEach(function (i) { i.align(); }); }, { passive: true });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) instances.forEach(function (i) { i.reset(); });
      });
      window.addEventListener('pagehide', function () { instances.forEach(function (i) { i.reset(); }); });
      motion.addEventListener('change', function () {
        instances.forEach(function (i) { i.reset(); i.ctx.reducedMotion = motion.matches; });
      });
    }
  };
})();
