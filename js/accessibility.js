(function (global) {
  "use strict";

  function settings() {
    return global.LeonSalStorage ? global.LeonSalStorage.getSettings() : {};
  }

  function prefersReducedMotion() {
    return Boolean(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function applyAccessibilityState(nextSettings) {
    var active = Object.assign({}, settings(), nextSettings || {});
    var root = document.documentElement;
    var reduced = Boolean(active.reducedMotion || prefersReducedMotion() || active.motion === false);
    root.classList.toggle("leonsal-reduced-motion", reduced);
    root.classList.toggle("leonsal-calm", Boolean(active.calmMode));
    root.dataset.leonsalMotion = reduced ? "reduced" : "full";
    root.dataset.leonsalSound = active.sound === false ? "off" : "on";
    root.dataset.leonsalVoice = active.voice === false ? "off" : "on";
    root.dataset.leonsalConfetti = active.confetti === false ? "off" : "on";
    return active;
  }

  function makeToggle(label, key) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "leonsal-toggle";
    button.textContent = label;
    button.dataset.settingKey = key;
    button.setAttribute("aria-pressed", String(Boolean(settings()[key])));
    button.addEventListener("click", function () {
      var current = settings();
      var next = {};
      next[key] = !Boolean(current[key]);
      var saved = global.LeonSalStorage.saveSettings(next);
      applyAccessibilityState(saved);
      button.setAttribute("aria-pressed", String(Boolean(saved[key])));
    });
    return button;
  }

  function createControls() {
    var row = document.createElement("div");
    row.className = "leonsal-control-row";
    row.setAttribute("aria-label", "LeonSal sensory controls");
    row.append(
      makeToggle("Sound", "sound"),
      makeToggle("Voice", "voice"),
      makeToggle("Motion", "motion"),
      makeToggle("Calm", "calmMode"),
      makeToggle("Confetti", "confetti")
    );
    return row;
  }

  global.addEventListener("leonsal:settings", function (event) {
    applyAccessibilityState(event.detail);
  });

  document.addEventListener("DOMContentLoaded", function () {
    applyAccessibilityState();
  });

  global.LeonSalAccessibility = {
    applyAccessibilityState: applyAccessibilityState,
    createControls: createControls,
    prefersReducedMotion: prefersReducedMotion
  };
})(window);
