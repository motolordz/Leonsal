(function (global) {
  "use strict";

  var stateLabels = {
    empty: "Empty / Sleepy",
    low: "Low Energy",
    calm: "Calm / Ready",
    happy: "Happy / Active",
    excited: "Full / Excited"
  };

  var stateClassNames = {
    empty: "empty",
    low: "low",
    calm: "calm",
    happy: "happy",
    excited: "excited"
  };

  var characterProfiles = {
    "battery-buddy": { id: "battery-buddy", family: "world", displayName: "Battery Buddy", pronoun: "its", article: "Battery Buddy", action: "fully charged and excited" },
    "battery": { aliasFor: "battery-buddy" },
    "elephant": { id: "elephant", family: "world", displayName: "Elephant", pronoun: "her", article: "Elephant", action: "fully charged and excited to play" },
    "double-decker": { id: "double-decker", family: "world", displayName: "Double-decker Bus", pronoun: "its", article: "Double-decker Bus", action: "fully charged and excited to roll" },
    "bus": { aliasFor: "double-decker" },
    "plane": { id: "plane", family: "world", displayName: "Plane", pronoun: "its", article: "Plane", action: "fully charged and excited to fly" },
    "boat": { id: "boat", family: "world", displayName: "Boat", pronoun: "its", article: "Boat", action: "fully charged and excited to sail" },
    "letter-a": { id: "letter-a", family: "world", displayName: "Letter A", pronoun: "its", article: "Letter A", action: "fully charged and excited for words" },
    "letter": { aliasFor: "letter-a" },
    "leon": { id: "leon", family: "guide", displayName: "Leon", pronoun: "his", article: "Leon", action: "happy, active and ready to play" },
    "zaya": { id: "zaya", family: "guide", displayName: "Zaya", pronoun: "her", article: "Zaya", action: "happy, active and ready to play" }
  };

  function normalizeCharacterId(id, glyph) {
    var raw = String(id || "battery-buddy").toLowerCase();
    if (raw === "letter" && glyph) {
      return /^[a-z]$/i.test(glyph) ? "letter-" + String(glyph).toLowerCase() : raw;
    }
    var profile = characterProfiles[raw];
    return profile && profile.aliasFor ? profile.aliasFor : raw;
  }

  function familyForCharacter(id) {
    var normal = normalizeCharacterId(id);
    var profile = characterProfiles[normal];
    if (profile && profile.family) return profile.family;
    if (/^letter-[a-z]$/.test(normal)) return "alphabet";
    if (/^number-(10|[1-9])$/.test(normal)) return "number";
    return "world";
  }

  function displayNameForCharacter(id) {
    var normal = normalizeCharacterId(id);
    var profile = characterProfiles[normal];
    if (profile && profile.displayName) return profile.displayName;
    if (/^letter-[a-z]$/.test(normal)) return "Letter " + normal.slice(-1).toUpperCase();
    if (/^number-(10|[1-9])$/.test(normal)) return "Number " + normal.replace("number-", "");
    return normal.split("-").map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function stateDescription(characterId, state) {
    var id = normalizeCharacterId(characterId);
    var profile = characterProfiles[id] || {
      displayName: displayNameForCharacter(id),
      pronoun: "their",
      article: displayNameForCharacter(id),
      action: "fully charged and excited"
    };
    if (state === "empty") return profile.article + " is resting. " + sentenceCase(profile.pronoun) + " energy is empty.";
    if (state === "low") return profile.article + " has low energy and may need a gentle moment.";
    if (state === "calm") return profile.article + " is calm, ready and balanced.";
    if (state === "happy") return profile.article + " is happy, active and ready to play.";
    return profile.article + " is " + profile.action + ".";
  }

  function sentenceCase(value) {
    return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
  }

  function stateFromPercent(percent) {
    var value = Math.max(0, Math.min(100, Number(percent) || 0));
    if (value < 20) return "empty";
    if (value < 40) return "low";
    if (value < 65) return "calm";
    if (value < 90) return "happy";
    return "excited";
  }

  function energyProfile(percent, characterId) {
    var value = Math.max(0, Math.min(100, Number(percent) || 0));
    var state = stateFromPercent(value);
    return {
      value: value,
      state: state,
      label: stateLabels[state],
      message: stateDescription(characterId, state),
      header: stateLabels[state],
      className: stateClassNames[state]
    };
  }

  function findRecord(registry, family, id) {
    if (!registry) return null;
    var normal = normalizeCharacterId(id);
    if (family === "guide") return (registry.guides || []).find(function (record) { return record.id === normal; }) || null;
    if (family === "alphabet") return (registry.alphabet || []).find(function (record) { return record.id === normal; }) || null;
    if (family === "number") return (registry.numbers || []).find(function (record) { return record.id === normal; }) || null;
    return (registry.world || []).find(function (record) { return record.id === normal; }) || null;
  }

  function createCharacter(options) {
    var character = document.createElement("div");
    var family = options.family || "world";
    var state = options.state || "calm";
    character.className = "ls-character";
    character.dataset.family = family;
    character.dataset.state = state;
    character.dataset.characterId = options.id || "";
    character.setAttribute("role", "img");
    character.setAttribute("aria-label", options.alt || options.displayName || "LeonSal character");

    var body = document.createElement("div");
    body.className = "ls-character-body";

    if (options.states) {
      var img = document.createElement("img");
      img.className = "ls-character-image";
      img.decoding = "async";
      img.loading = options.loading || "lazy";
      img.alt = "";
      img.src = options.states[state] || options.states.calm || "";
      body.appendChild(img);
      character._leonsalStates = options.states;
    } else {
      body.textContent = options.symbol || options.letter || options.value || "";
    }

    var face = document.createElement("div");
    face.className = "ls-character-face";
    face.setAttribute("aria-hidden", "true");
    face.innerHTML = "<span></span><span></span><b></b>";

    var label = document.createElement("strong");
    label.className = "ls-character-label";
    label.textContent = options.displayName || options.letter || options.value || "";

    character.append(body);
    if (!options.states) {
      character.append(face);
    }
    character.append(label);
    return character;
  }

  function setState(element, state) {
    if (!element) return;
    element.dataset.state = state;
    if (element._leonsalStates) {
      var image = element.querySelector(".ls-character-image");
      if (image && element._leonsalStates[state]) {
        image.src = element._leonsalStates[state];
      }
    }
    var label = element.querySelector(".ls-state-label");
    if (label) {
      label.textContent = stateLabels[state] || state;
    }
  }

  function createEnergySlider(characterElement, initialPercent) {
    var wrap = document.createElement("label");
    wrap.className = "ls-energy-control";
    var value = Number(initialPercent || 50);
    var stateLabel = document.createElement("span");
    stateLabel.className = "ls-state-label";
    stateLabel.textContent = stateLabels[stateFromPercent(value)];

    var input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "100";
    input.step = "1";
    input.value = String(value);
    input.setAttribute("aria-label", "Character energy level");

    input.addEventListener("input", function () {
      var state = stateFromPercent(input.value);
      setState(characterElement, state);
      stateLabel.textContent = stateLabels[state];
    });

    wrap.append("Energy ", input, stateLabel);
    setState(characterElement, stateFromPercent(value));
    return wrap;
  }

  function preloadStates(states) {
    if (!states) return;
    Object.keys(states).forEach(function (key) {
      var image = new Image();
      image.src = states[key];
    });
  }

  function renderCharacterGrid(target, records, mapper) {
    var root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) return null;
    var grid = document.createElement("div");
    grid.className = "ls-character-grid";
    records.forEach(function (record) {
      grid.appendChild(createCharacter(mapper ? mapper(record) : record));
    });
    root.appendChild(grid);
    return grid;
  }

  global.LeonSalCharacters = {
    stateLabels: stateLabels,
    stateFromPercent: stateFromPercent,
    energyProfile: energyProfile,
    normalizeCharacterId: normalizeCharacterId,
    familyForCharacter: familyForCharacter,
    displayNameForCharacter: displayNameForCharacter,
    stateDescription: stateDescription,
    findRecord: findRecord,
    createCharacter: createCharacter,
    createEnergySlider: createEnergySlider,
    preloadStates: preloadStates,
    renderCharacterGrid: renderCharacterGrid,
    setState: setState
  };
})(window);
