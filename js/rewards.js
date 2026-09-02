(function (global) {
  "use strict";

  var colors = ["#1267d8", "#22a447", "#ffd33d", "#ee5f9d", "#ff9f1c"];

  function settings() {
    return global.LeonSalStorage ? global.LeonSalStorage.getSettings() : {};
  }

  function canCelebrate() {
    var current = settings();
    return current.confetti !== false && current.motion !== false && current.reducedMotion !== true && current.calmMode !== true;
  }

  function awardStars(count) {
    if (global.LeonSalStorage) {
      return global.LeonSalStorage.addStars(count || 1);
    }
    return 0;
  }

  function awardBadge(badgeId) {
    if (global.LeonSalStorage) {
      return global.LeonSalStorage.addBadge(badgeId);
    }
    return [];
  }

  function confetti(count) {
    if (!canCelebrate()) {
      return false;
    }

    var layer = document.createElement("div");
    layer.className = "leonsal-confetti";
    layer.setAttribute("aria-hidden", "true");
    var pieces = Math.min(36, Math.max(8, count || 18));

    for (var index = 0; index < pieces; index += 1) {
      var piece = document.createElement("span");
      piece.className = "leonsal-confetti-piece";
      piece.style.background = colors[index % colors.length];
      piece.style.left = Math.round(Math.random() * 100) + "vw";
      piece.style.animationDelay = Math.round(Math.random() * 220) + "ms";
      layer.appendChild(piece);
    }

    document.body.appendChild(layer);
    global.setTimeout(function () {
      layer.remove();
    }, 1300);
    return true;
  }

  function celebrate(message, options) {
    var stars = awardStars((options && options.stars) || 1);
    if (options && options.badgeId) {
      awardBadge(options.badgeId);
    }
    confetti(options && options.confettiPieces);
    if (message && global.LeonSalVoice) {
      global.LeonSalVoice.speak(message);
    }
    return stars;
  }

  global.LeonSalRewards = {
    awardStars: awardStars,
    awardBadge: awardBadge,
    confetti: confetti,
    celebrate: celebrate,
    canCelebrate: canCelebrate
  };
})(window);
