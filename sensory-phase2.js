'use strict';

  const characterProfiles = {
    battery: { name: 'Battery Buddy', sprite: 'sprite-battery', empty: 'Battery Buddy is resting. Its energy is empty.' },
    elephant: { name: 'Ellie Elephant', sprite: 'sprite-elephant', empty: 'Ellie is lying low and resting her big body.' },
    bus: { name: 'Leon Bus', sprite: 'sprite-bus', empty: 'Leon Bus is parked with sleepy lights.' },
    plane: { name: 'Sky Plane', sprite: 'sprite-plane', empty: 'Sky Plane is resting safely on the runway.' },
    boat: { name: 'Bobby Boat', sprite: 'sprite-boat', empty: 'Bobby Boat is quiet at the dock.' },
    letter: { name: 'Amazing A', sprite: 'sprite-letter', empty: 'Amazing A is resting before the next word.' }
  };

  const worldSprite = $('#worldSprite');
  const glyphCharacter = $('#glyphCharacter');
  const glyphPack = $('#glyphPack');
  const glyphColours = ['#348de3', '#4daf5a', '#f28b35', '#8270d5', '#df5f97', '#168fa2'];

  function selectedCharacter() {
    if (state.character === 'letter') {
      const isNumber = /[0-9]/.test(state.glyph);
      return { ...characterProfiles.letter, name: `${isNumber ? 'Number' : 'Letter'} ${state.glyph}`, empty: `${state.glyph} is resting before the next adventure.` };
    }
    return characterProfiles[state.character] || characterProfiles.battery;
  }

  function renderCharacterWorld(options = {}) {
    const profile = selectedCharacter();
    worldSprite.className = `world-sprite sprite ${profile.sprite}`;
    const glyphMode = state.character === 'letter';
    elements.energyBuddy.classList.toggle('is-glyph', glyphMode);
    glyphCharacter.querySelector('b').textContent = state.glyph;
    glyphCharacter.style.setProperty('--glyph-colour', glyphColours[(state.glyph.charCodeAt(0) || 0) % glyphColours.length]);
    elements.dashBuddy.className = glyphMode ? 'dash-buddy is-glyph' : `dash-buddy sprite ${profile.sprite}`;
    elements.dashBuddy.textContent = glyphMode ? state.glyph : '';
    $$('.character-choice').forEach((button) => {
      const selected = button.dataset.character === state.character;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (state.energy <= 5) elements.energyMessage.textContent = profile.empty;
    else if (state.energy >= 85) elements.energyMessage.textContent = `${profile.name} is fully charged, bright and ready to help.`;
    if (options.announce !== false) announce(`${profile.name} selected.`);
  }

  $$('.character-choice').forEach((button) => {
    button.addEventListener('click', () => {
      state.character = button.dataset.character;
      saveState();
      renderCharacterWorld();
      playTone('tap');
      vibrate(12);
    });
  });

  function renderGlyphPack(pack = 'letters') {
    const values = pack === 'letters'
      ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      : '0123456789'.split('');
    glyphPack.setAttribute('aria-label', pack === 'letters' ? 'Alphabet character choices' : 'Number character choices');
    glyphPack.replaceChildren();
    values.forEach((glyph, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `glyph-choice${state.character === 'letter' && state.glyph === glyph ? ' is-selected' : ''}`;
      button.textContent = glyph;
      button.style.setProperty('--glyph-colour', glyphColours[index % glyphColours.length]);
      button.setAttribute('aria-label', `Choose ${pack === 'letters' ? 'letter' : 'number'} ${glyph}`);
      button.addEventListener('click', () => {
        state.character = 'letter';
        state.glyph = glyph;
        saveState();
        renderGlyphPack(pack);
        renderCharacterWorld();
        playTone('tap');
        vibrate(10);
      });
      glyphPack.appendChild(button);
    });
  }

  $$('.pack-switch button').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.pack-switch button').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      renderGlyphPack(button.dataset.pack);
      playTone('tap');
    });
  });
  elements.energySlider.addEventListener('input', () => renderCharacterWorld({ announce: false }));
  elements.energySlider.addEventListener('change', () => renderCharacterWorld({ announce: false }));
  elements.bedtimeButton.addEventListener('click', () => window.setTimeout(() => renderCharacterWorld({ announce: false }), 1850));
  elements.morningButton.addEventListener('click', () => window.setTimeout(() => renderCharacterWorld({ announce: false }), 2150));

  // A direct sensory menu. Nothing locks the child into the suggested activity.
  const sensorySuggestions = {
    move: { panel: 'dash', message: 'Movement chosen. Dash to the Charging Dock is open.' },
    quiet: { panel: 'bubbles', message: 'Quiet chosen. Motion is paused and Quiet Bubbles is open.' },
    breathe: { panel: 'breathe', message: 'Breathing chosen. Hold to Breathe & Charge is open.' },
    tap: { panel: 'bubbles', message: 'Tapping chosen. Quiet Bubble Pop is open.' },
    watch: { panel: 'draw', message: 'Watching chosen. The gentle Finger Light Trail is open.' },
    match: { panel: 'pattern', message: 'Matching chosen. Copy the Pattern is open.' },
    draw: { panel: 'draw', message: 'Drawing chosen. Finger Light Trail is open.' },
    rest: { panel: 'breathe', message: 'Rest chosen. Night mode and a slow battery rest are starting.' }
  };
  const sensorySuggestion = $('#sensorySuggestion');
  $$('.sensory-choice-grid button').forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const key = button.dataset.sensory;
      const choice = sensorySuggestions[key];
      $$('.sensory-choice-grid button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      if (key === 'quiet') {
        state.motion = false;
        renderSettings();
        saveState();
      }
      if (key === 'rest') elements.bedtimeButton.click();
      selectPanel(choice.panel, false);
      sensorySuggestion.textContent = choice.message;
      $('#activityTitle')?.scrollIntoView({ behavior: state.motion ? 'smooth' : 'auto', block: 'start' });
      announce(choice.message);
      playTone('tap');
      vibrate(10);
    });
  });

  // Body communication board: child chooses an area, then a simple need word.
  const bodyNeeds = {
    head: ['Sore', 'Tired', 'Dizzy', 'Too busy'],
    ears: ['Too loud', 'Sore', 'Headphones', 'Quiet'],
    mouth: ['Hungry', 'Thirsty', 'Sore', 'Brush teeth'],
    chest: ['Worried', 'Hard to breathe', 'Sad', 'Heart fast'],
    tummy: ['Hungry', 'Sore', 'Toilet', 'Full'],
    hands: ['Sore', 'Cold', 'Want to squeeze', 'Want to hold'],
    legs: ['Sore', 'Wiggly', 'Tired', 'Want to move'],
    feet: ['Sore', 'Hot', 'Cold', 'Shoes off']
  };
  const bodyAvatar = $('#bodyAvatar');
  const needOptions = $('#needOptions');
  const bodyMessage = $('#bodyMessage');
  let chosenBodyArea = '';

  $$('.avatar-toggle button').forEach((button) => {
    button.addEventListener('click', () => {
      const avatar = button.dataset.avatar;
      bodyAvatar.className = `body-avatar avatar-${avatar}`;
      bodyAvatar.setAttribute('aria-label', `${avatar === 'boy' ? 'Boy' : 'Girl'} body map`);
      $$('.avatar-toggle button').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      playTone('tap');
    });
  });

  $$('.body-zone-grid button').forEach((button) => {
    button.addEventListener('click', () => {
      chosenBodyArea = button.dataset.body;
      $$('.body-zone-grid button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      needOptions.hidden = false;
      needOptions.replaceChildren();
      bodyNeeds[chosenBodyArea].forEach((need) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.textContent = need;
        option.setAttribute('aria-pressed', 'false');
        option.addEventListener('click', () => {
          $$('#needOptions button').forEach((item) => item.setAttribute('aria-pressed', String(item === option)));
          const areaName = chosenBodyArea.charAt(0).toUpperCase() + chosenBodyArea.slice(1);
          bodyMessage.textContent = `My ${chosenBodyArea} feels: ${need}. Please show a grown-up.`;
          announce(`${areaName}. ${need}. Please show a grown-up.`);
          playTone('tap');
          vibrate(12);
        });
        needOptions.appendChild(option);
      });
      bodyMessage.textContent = `${button.textContent} selected. What is happening there?`;
      needOptions.querySelector('button')?.focus({ preventScroll: true });
      playTone('tap');
    });
  });

  // Charging Dock 2.0: travel -> charge -> power a helper -> gentle energy drain -> ready again.
  const dockMeterFill = $('#dockMeterFill');
  const dockMeterLabel = $('#dockMeterLabel');
  const helperButtons = $$('.power-helpers button');
  let selectedHelper = 'lamp';
  let powerCycleBusy = false;
  let chargeFrame = 0;
  let drainFrame = 0;

  helperButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedHelper = button.dataset.helper;
      helperButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      elements.dashStatus.textContent = `${button.textContent.trim()} will receive energy after charging.`;
      playTone('tap');
    });
  });

  function setDockControlsDisabled(disabled) {
    elements.dashSlider.disabled = disabled;
    elements.dashLeft.disabled = disabled;
    elements.dashRight.disabled = disabled;
  }

  function beginHelperDrain(helperButton) {
    window.cancelAnimationFrame(drainFrame);
    const start = performance.now();
    const duration = state.motion && !prefersReducedMotion.matches ? 16000 : 900;
    helperButton.classList.add('is-powered');
    elements.dashStatus.textContent = `${helperButton.textContent.trim()} is glowing while your character shares energy.`;

    const drain = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      setEnergy(100 - (progress * 55), { persist: false });
      renderCharacterWorld({ announce: false });
      dockMeterFill.style.width = `${Math.round(100 - (progress * 55))}%`;
      dockMeterLabel.textContent = `Helping ${helperButton.textContent.trim()} · ${Math.round(100 - (progress * 55))}% left`;
      if (progress < 1) drainFrame = window.requestAnimationFrame(drain);
      else {
        setEnergy(45);
        saveState();
        helperButton.classList.remove('is-powered');
        dockMeterLabel.textContent = 'Ready to recharge';
        elements.dashStatus.textContent = 'Energy was shared. Visit the dock again whenever you want.';
        powerCycleBusy = false;
        setDockControlsDisabled(false);
      }
    };
    drainFrame = window.requestAnimationFrame(drain);
  }

  function beginSmartCharge() {
    if (powerCycleBusy) return;
    powerCycleBusy = true;
    window.cancelAnimationFrame(chargeFrame);
    window.cancelAnimationFrame(drainFrame);
    helperButtons.forEach((button) => button.classList.remove('is-powered'));
    setDockControlsDisabled(true);
    const profile = selectedCharacter();
    const start = performance.now();
    const duration = state.motion && !prefersReducedMotion.matches ? 2300 : 150;
    elements.dashStatus.textContent = `${profile.name} clicked into the dock. Charging gently…`;
    playTone('success');
    vibrate([15, 40, 15]);

    const charge = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const amount = Math.round(12 + (progress * 88));
      dockMeterFill.style.width = `${amount}%`;
      dockMeterLabel.textContent = amount >= 100 ? 'Fully charged!' : `Charging · ${amount}%`;
      setEnergy(amount, { persist: false });
      renderCharacterWorld({ announce: false });
      if (progress < 1) chargeFrame = window.requestAnimationFrame(charge);
      else {
        setEnergy(100);
        saveState();
        playTone('success');
        elements.dashStatus.textContent = `${profile.name} is full of energy and popping back to help!`;
        window.setTimeout(() => {
          elements.dashReset.click();
          const helperButton = helperButtons.find((button) => button.dataset.helper === selectedHelper) || helperButtons[0];
          beginHelperDrain(helperButton);
        }, state.motion ? 850 : 50);
      }
    };
    chargeFrame = window.requestAnimationFrame(charge);
  }

  function checkForDock() {
    if (Number(elements.dashSlider.value) >= 94) beginSmartCharge();
  }
  elements.dashSlider.addEventListener('input', checkForDock);
  elements.dashRight.addEventListener('click', () => window.setTimeout(checkForDock, 0));
  elements.dashLeft.addEventListener('click', () => window.setTimeout(checkForDock, 0));
  elements.dashReset.addEventListener('click', () => {
    if (!powerCycleBusy) {
      dockMeterFill.style.width = '12%';
      dockMeterLabel.textContent = 'Ready to travel · 12%';
    }
  });

  dockMeterFill.style.width = '12%';
  dockMeterLabel.textContent = 'Ready to travel · 12%';
  renderGlyphPack(/[0-9]/.test(state.glyph) ? 'numbers' : 'letters');
  renderCharacterWorld({ announce: false });
