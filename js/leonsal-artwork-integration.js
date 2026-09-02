(function () {
  "use strict";

  var states = ["empty", "low", "calm", "happy", "excited"];
  var registryPromise = null;

  function loadRegistry() {
    if (!registryPromise) {
      registryPromise = fetch("data/character-assets.json").then(function (response) {
        if (!response.ok) throw new Error("Unable to load character assets");
        return response.json();
      });
    }
    return registryPromise;
  }

  function byId(items, id) {
    return (items || []).find(function (item) { return item.id === id; });
  }

  function byValue(items, value) {
    return (items || []).find(function (item) { return String(item.value) === String(value); });
  }

  function byLetter(items, letter) {
    return (items || []).find(function (item) { return item.uppercase === String(letter).toUpperCase(); });
  }

  function setRealImage(target, record, state, label) {
    if (!target || !record || !record.states || !record.states[state]) return false;
    if (/source-safe-keeping|rejected-character-crops-v1/.test(record.states[state])) return false;
    target.classList.add("ls-real-art-host");
    target.dataset.realCharacterId = record.id;
    target.dataset.realState = state;
    var img = target.querySelector(":scope > img.ls-real-art");
    if (!img) {
      img = document.createElement("img");
      img.className = "ls-real-art";
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = label || record.displayName || record.id;
      target.replaceChildren(img);
    }
    img.src = record.states[state];
    img.alt = label || record.displayName || record.id;
    return true;
  }

  function preload(record) {
    if (!record || !record.states) return;
    states.forEach(function (state) {
      var img = new Image();
      img.src = record.states[state];
    });
  }

  function installHomeEnergy(registry) {
    var map = {
      battery: "battery-buddy",
      elephant: "elephant",
      bus: "double-decker",
      plane: "plane",
      boat: "boat",
      letter: "letter-a",
      leon: "leon",
      zaya: "zaya"
    };
    var slider = document.getElementById("energySlider");
    var worldSprite = document.getElementById("worldSprite");
    var dashBuddy = document.getElementById("dashBuddy");
    var glyph = document.getElementById("glyphCharacter");
    var sleepCloud = document.getElementById("sleepCloud");
    var energyNumber = document.getElementById("energyNumber");

    function render() {
      var appState = window.leonSalState || {};
      var characterId = window.LeonSalCharacters.normalizeCharacterId(appState.character || "battery-buddy", appState.glyph);
      var family = window.LeonSalCharacters.familyForCharacter(characterId);
      var state = window.LeonSalCharacters.stateFromPercent(slider ? slider.value : appState.energy);
      var record = window.LeonSalCharacters.findRecord(registry, family, characterId);
      preload(record);
      setRealImage(worldSprite, record, state, (record && record.displayName) + " " + state);
      setRealImage(dashBuddy, record, state, (record && record.displayName) + " " + state);
      if (glyph) glyph.hidden = true;
      if (sleepCloud) sleepCloud.hidden = true;
      if (energyNumber) energyNumber.textContent = (slider ? slider.value : lastEnergyPercent) + "%";
    }

    document.querySelectorAll("[data-character]").forEach(function (button) {
      var family = button.dataset.character === "leon" || button.dataset.character === "zaya" ? "guides" : "world";
      var record = byId(registry[family], map[button.dataset.character]);
      var icon = button.querySelector(".sprite");
      if (record && icon) {
        setRealImage(icon, record, "calm", record.displayName + " thumbnail");
      }
      button.addEventListener("click", function () {
        render();
      });
    });

    if (slider) {
      slider.addEventListener("input", render);
    }
    render();
  }

  function replaceNumberBuddies(registry) {
    document.querySelectorAll(".buddy").forEach(function (buddy) {
      if (buddy.dataset.realApplied === "true") return;
      var number = buddy.querySelector(".buddy-number");
      if (!number) return;
      var value = number.textContent.trim();
      var record = byValue(registry.numbers, value);
      if (!record) return;
      buddy.dataset.realApplied = "true";
      setRealImage(buddy, record, buddy.classList.contains("pop-in") ? "happy" : "calm", "Number " + value + " character");
    });
  }

  function replaceAlphabetBuddies(registry) {
    document.querySelectorAll(".buddy").forEach(function (buddy) {
      if (buddy.dataset.realApplied === "true") return;
      var letter = buddy.querySelector(".buddy-number");
      if (!letter) return;
      var value = letter.textContent.trim();
      if (!/^[a-z]$/i.test(value)) return;
      var record = byLetter(registry.alphabet, value);
      if (!record) return;
      buddy.dataset.realApplied = "true";
      setRealImage(buddy, record, buddy.classList.contains("pop-in") ? "happy" : "calm", "Letter " + value.toUpperCase() + " character");
    });

    document.querySelectorAll(".letter-tile").forEach(function (tile) {
      if (tile.dataset.realApplied === "true") return;
      var value = tile.textContent.trim();
      var record = byLetter(registry.alphabet, value);
      if (!record) return;
      tile.dataset.realApplied = "true";
      tile.textContent = "";
      setRealImage(tile, record, "calm", "Letter " + value.toUpperCase() + " thumbnail");
    });
  }

  function installShapeHelper(registry) {
    if (!document.getElementById("shapesFoundNum") || document.querySelector(".ls-shape-art-helper")) return;
    var target = document.querySelector(".shapes-found-wrap") || document.querySelector(".title");
    var guide = byId(registry.guides, "leon");
    var house = byId(registry.world, "house");
    if (!target || !guide || !house) return;

    var helper = document.createElement("section");
    helper.className = "ls-shape-art-helper";
    helper.setAttribute("aria-label", "Leon and House Helper");

    var leon = document.createElement("span");
    var home = document.createElement("span");
    var message = document.createElement("p");
    message.textContent = "Leon and House Helper are ready to build. Keep the triangle roof above the square body.";

    setRealImage(leon, guide, "calm", "Leon ready to help with shapes");
    setRealImage(home, house, "calm", "House Helper ready to build");
    helper.append(leon, message, home);
    target.insertAdjacentElement("afterend", helper);
  }

  function observe(callback) {
    callback();
    var observer = new MutationObserver(callback);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadRegistry().then(function (registry) {
      if (document.getElementById("energySlider")) installHomeEnergy(registry);
      installShapeHelper(registry);
      observe(function () {
        replaceNumberBuddies(registry);
        replaceAlphabetBuddies(registry);
      });
    }).catch(function (error) {
      console.error(error);
    });
  });
})();
