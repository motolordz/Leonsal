(function (global) {
  "use strict";

  function createHomeButton(homeUrl) {
    var link = document.createElement("a");
    link.className = "leonsal-home-button";
    link.href = homeUrl || "index.html";
    link.textContent = "Home";
    link.setAttribute("aria-label", "Go to LeonSal home");
    return link;
  }

  function createHeader(options) {
    var header = document.createElement("header");
    header.className = "leonsal-game-header";

    var brand = document.createElement("div");
    brand.className = "leonsal-brand";

    var mark = document.createElement("span");
    mark.className = "leonsal-brand-mark";
    mark.textContent = "LS";
    mark.setAttribute("aria-hidden", "true");

    var title = document.createElement("h1");
    title.className = "leonsal-game-title";
    title.textContent = (options && options.title) || document.title || "LeonSal";

    brand.append(mark, title);

    var actions = document.createElement("div");
    actions.className = "leonsal-header-actions";
    actions.appendChild(createHomeButton(options && options.homeUrl));
    if (global.LeonSalAccessibility) {
      actions.appendChild(global.LeonSalAccessibility.createControls());
    }

    header.append(brand, actions);
    return header;
  }

  function createGuide(options) {
    var guide = document.createElement("section");
    guide.className = "leonsal-guide";
    guide.setAttribute("aria-label", "Leon guide message");

    var avatar = document.createElement("div");
    avatar.className = "leonsal-guide-avatar";

    if (options && options.avatarSrc) {
      var img = document.createElement("img");
      img.src = options.avatarSrc;
      img.alt = (options.guideName || "Leon") + " guide";
      avatar.appendChild(img);
    } else {
      avatar.textContent = (options && options.guideInitial) || "L";
      avatar.setAttribute("aria-hidden", "true");
    }

    var speech = document.createElement("p");
    speech.className = "leonsal-speech";
    speech.textContent = (options && options.message) || "Ready to learn, play, and grow?";

    guide.append(avatar, speech);
    return guide;
  }

  function mountHeader(target, options) {
    var parent = typeof target === "string" ? document.querySelector(target) : target;
    var header = createHeader(options || {});
    if (parent) {
      parent.prepend(header);
    } else {
      document.body.prepend(header);
    }
    return header;
  }

  function mountGuide(target, options) {
    var parent = typeof target === "string" ? document.querySelector(target) : target;
    var guide = createGuide(options || {});
    (parent || document.body).appendChild(guide);
    return guide;
  }

  function initGame(options) {
    var settings = global.LeonSalAccessibility && global.LeonSalAccessibility.applyAccessibilityState();
    if (!document.body.classList.contains("leonsal-shell")) {
      document.body.classList.add("leonsal-shell");
    }
    var header = mountHeader(options && options.headerTarget, options || {});
    var guide = null;
    if (!options || options.guide !== false) {
      guide = mountGuide((options && options.guideTarget) || "main", options || {});
    }
    return {
      header: header,
      guide: guide,
      settings: settings
    };
  }

  async function loadJson(path) {
    var response = await fetch(path);
    if (!response.ok) {
      throw new Error("Unable to load " + path);
    }
    return response.json();
  }

  global.LeonSal = {
    createHeader: createHeader,
    createHomeButton: createHomeButton,
    createGuide: createGuide,
    initGame: initGame,
    loadJson: loadJson
  };
})(window);
