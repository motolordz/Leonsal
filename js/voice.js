(function (global) {
  "use strict";

  function enabled() {
    var storage = global.LeonSalStorage;
    var settings = storage ? storage.getSettings() : {};
    return settings.sound !== false && settings.voice !== false && "speechSynthesis" in global;
  }

  function speak(text, options) {
    if (!text || !enabled()) {
      return false;
    }

    var utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = (options && options.lang) || "en";
    utterance.rate = Math.min(1.1, Math.max(0.75, (options && options.rate) || 0.9));
    utterance.pitch = Math.min(1.2, Math.max(0.8, (options && options.pitch) || 1));
    global.speechSynthesis.cancel();
    global.speechSynthesis.speak(utterance);
    return true;
  }

  function stop() {
    if ("speechSynthesis" in global) {
      global.speechSynthesis.cancel();
    }
  }

  global.addEventListener("leonsal:settings", function (event) {
    if (event.detail.sound === false || event.detail.voice === false) {
      stop();
    }
  });

  global.LeonSalVoice = {
    speak: speak,
    stop: stop,
    enabled: enabled
  };
})(window);
