/* Short click sounds. Asset origins are documented in division-sfx/manifest.json. */
(function () {
  'use strict';
  var names = {
    naraka: ['petals', 'parry', 'sigil'],
    identityv: ['butterfly', 'shutter', 'blossom'],
    overwatch: ['blade', 'shot', 'energy'],
    lol: ['spirit', 'snip', 'wind']
  };
  var pool = Object.create(null);
  var current = null;
  var owner = null;
  var request = 0;

  function prepare(name) {
    if (pool[name]) return pool[name];
    var audio = document.createElement('audio');
    audio.src = 'assets/division-sfx/' + name + '.wav?v=20261001-kindred-v3';
    audio.preload = 'auto';
    audio.volume = .55;
    audio.hidden = true;
    audio.dataset.divisionSound = name;
    document.body.appendChild(audio);
    pool[name] = audio;
    return audio;
  }
  function stop(slot) {
    if (slot && slot !== owner) return;
    request++;
    if (current) { current.pause(); current.currentTime = 0; }
    current = null;
    owner = null;
  }
  window.NJAUEC_DIVISION_SOUND = {
    prepare: function (id, index) {
      if (!names[id]) return;
      prepare(names[id][index]);
      if (id === 'overwatch' && index === 1) prepare('shot-reload');
    },
    play: function (id, index, ctx) {
      if (!names[id] || document.hidden) return;
      stop();
      var name = names[id][index];
      if (id === 'overwatch' && index === 1 && ctx.slot.classList.contains('owf-reloading')) name = 'shot-reload';
      var audio = prepare(name);
      var ticket = request;
      current = audio;
      owner = ctx.slot;
      var playing = audio.play();
      // Do not retry or queue blocked playback; another user click may try again.
      if (playing && playing.catch) playing.catch(function () {
        if (ticket === request) { current = null; owner = null; }
      });
    },
    stop: stop
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
  window.addEventListener('pagehide', function () { stop(); });
}());
