(function (global) {
  "use strict";

  var stateLabels = {
    empty: "Empty / Sleepy",
    low: "Low",
    calm: "Calm / Ready",
    happy: "Happy / Active",
    excited: "Full / Excited"
  };

  function stateFromPercent(percent) {
    var value = Math.max(0, Math.min(100, Number(percent) || 0));
    if (value < 20) return "empty";
    if (value < 40) return "low";
    if (value < 65) return "calm";
    if (value < 90) return "happy";
    return "excited";
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
    createCharacter: createCharacter,
    createEnergySlider: createEnergySlider,
    preloadStates: preloadStates,
    renderCharacterGrid: renderCharacterGrid,
    setState: setState
  };
})(window);
