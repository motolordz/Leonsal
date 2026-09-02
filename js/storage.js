(function (global) {
  "use strict";

  var KEY = "leonsal.progress.v1";
  var SETTINGS_KEY = "leonsal.settings.v1";

  var defaults = {
    motion: true,
    sound: true,
    voice: true,
    vibration: true,
    reducedMotion: false,
    calmMode: false,
    confetti: true
  };

  function readJson(key, fallback) {
    try {
      var raw = global.localStorage && global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      return false;
    }
    return true;
  }

  function getSettings() {
    return Object.assign({}, defaults, readJson(SETTINGS_KEY, {}));
  }

  function saveSettings(nextSettings) {
    var settings = Object.assign({}, getSettings(), nextSettings || {});
    writeJson(SETTINGS_KEY, settings);
    global.dispatchEvent(new CustomEvent("leonsal:settings", { detail: settings }));
    return settings;
  }

  function getProgress() {
    return readJson(KEY, { games: {}, badges: [], stars: 0 });
  }

  function saveGameProgress(gameId, patch) {
    var progress = getProgress();
    progress.games[gameId] = Object.assign({}, progress.games[gameId] || {}, patch || {}, {
      updatedAt: new Date().toISOString()
    });
    writeJson(KEY, progress);
    global.dispatchEvent(new CustomEvent("leonsal:progress", { detail: progress }));
    return progress.games[gameId];
  }

  function addStars(count) {
    var progress = getProgress();
    progress.stars = Math.max(0, Number(progress.stars || 0) + Number(count || 0));
    writeJson(KEY, progress);
    global.dispatchEvent(new CustomEvent("leonsal:progress", { detail: progress }));
    return progress.stars;
  }

  function addBadge(badgeId) {
    var progress = getProgress();
    if (badgeId && progress.badges.indexOf(badgeId) === -1) {
      progress.badges.push(badgeId);
      writeJson(KEY, progress);
      global.dispatchEvent(new CustomEvent("leonsal:progress", { detail: progress }));
    }
    return progress.badges.slice();
  }

  global.LeonSalStorage = {
    getSettings: getSettings,
    saveSettings: saveSettings,
    getProgress: getProgress,
    saveGameProgress: saveGameProgress,
    addStars: addStars,
    addBadge: addBadge
  };
})(window);
