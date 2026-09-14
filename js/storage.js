(function (global) {
  "use strict";

  var KEY = "leonsal.progress.v1";
  var SETTINGS_KEY = "leonsal.settings.v1";
  var V2_SETTINGS_KEY = "leonsal-v2-settings";

  var defaults = {
    motion: true,
    sound: true,
    voice: true,
    vibration: true,
    reducedMotion: false,
    calmMode: false,
    confetti: true,
    effectsLevel: "soft",
    voiceLevel: "soft",
    musicLevel: "soft"
  };

  function readJson(key, fallback) {
    try {
      var raw = global.localStorage && global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function fromV2Settings(settings) {
    var result = {};
    ["motion", "sound", "voice", "vibration", "reducedMotion", "calmMode", "confetti"].forEach(function (key) {
      if (typeof settings[key] === "boolean") result[key] = settings[key];
    });
    ["effectsLevel", "voiceLevel", "musicLevel"].forEach(function (key) {
      if (["off", "soft", "medium"].indexOf(settings[key]) >= 0) result[key] = settings[key];
    });
    return result;
  }

  function toV2Settings(settings) {
    var existing = readJson(V2_SETTINGS_KEY, {});
    return Object.assign({}, existing, {
      motion: Boolean(settings.motion),
      sound: Boolean(settings.sound),
      voice: Boolean(settings.voice),
      vibration: Boolean(settings.vibration),
      reducedMotion: Boolean(settings.reducedMotion),
      calmMode: Boolean(settings.calmMode),
      confetti: Boolean(settings.confetti),
      effectsLevel: ["off", "soft", "medium"].indexOf(settings.effectsLevel) >= 0 ? settings.effectsLevel : existing.effectsLevel,
      voiceLevel: ["off", "soft", "medium"].indexOf(settings.voiceLevel) >= 0 ? settings.voiceLevel : existing.voiceLevel,
      musicLevel: ["off", "soft", "medium"].indexOf(settings.musicLevel) >= 0 ? settings.musicLevel : existing.musicLevel
    });
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
    return Object.assign({}, defaults, readJson(SETTINGS_KEY, {}), fromV2Settings(readJson(V2_SETTINGS_KEY, {})));
  }

  function saveSettings(nextSettings) {
    var settings = Object.assign({}, getSettings(), nextSettings || {});
    writeJson(SETTINGS_KEY, settings);
    writeJson(V2_SETTINGS_KEY, toV2Settings(settings));
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
