'use strict';

  const STORAGE_KEY = 'leonsal-sensory-v1';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const defaults = {
    energy: 68,
    routine: 'day',
    motion: !prefersReducedMotion.matches,
    sound: false,
    haptic: false,
    contrast: false,
    feeling: null,
    character: 'battery',
    glyph: 'A'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  const elements = {
    root: document.documentElement,
    body: document.body,
    headerStatus: $('#headerStatus'),
    energySlider: $('#energySlider'),
    energyBuddy: $('#energyBuddy'),
    characterStage: $('#characterStage'),
    energyNumber: $('#energyNumber'),
    energyState: $('#energyState'),
    energyPill: $('#energyPill'),
    energyMessage: $('#energyMessage'),
    skySymbol: $('#skySymbol'),
    bedtimeButton: $('#bedtimeButton'),
    morningButton: $('#morningButton'),
    motionToggle: $('#motionToggle'),
    soundToggle: $('#soundToggle'),
    hapticToggle: $('#hapticToggle'),
    contrastToggle: $('#contrastToggle'),
    feelingSuggestion: $('#feelingSuggestion'),
    liveRegion: $('#liveRegion'),
    dashLane: $('#dashLane'),
    dashBuddy: $('#dashBuddy'),
    dashSlider: $('#dashSlider'),
    dashLeft: $('#dashLeft'),
    dashRight: $('#dashRight'),
    dashReset: $('#dashReset'),
    dashStatus: $('#dashStatus'),
    bubbleGrid: $('#bubbleGrid'),
    bubbleReset: $('#bubbleReset'),
    bubbleStatus: $('#bubbleStatus'),
    breatheOrb: $('#breatheOrb'),
    breathePercent: $('#breathePercent'),
    breatheStatus: $('#breatheStatus'),
    patternTarget: $('#patternTarget'),
    patternOptions: $('#patternOptions'),
    patternProgress: $('#patternProgress'),
    patternStatus: $('#patternStatus'),
    newPattern: $('#newPattern'),
    trailCanvas: $('#trailCanvas'),
    trailStatus: $('#trailStatus'),
    clearTrail: $('#clearTrail'),
    resetAll: $('#resetAll')
  };

  function loadState() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      const savedCharacter = String(saved.character || '');
      const validCharacter = ['battery', 'battery-buddy', 'elephant', 'bus', 'double-decker', 'plane', 'boat', 'letter', 'letter-a', 'leon', 'zaya'].includes(savedCharacter) ||
        /^letter-[a-z]$/.test(savedCharacter) ||
        /^number-(10|[1-9])$/.test(savedCharacter) ||
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(savedCharacter);
      return {
        energy: clamp(Number.isFinite(Number(saved.energy)) ? Number(saved.energy) : defaults.energy, 0, 100),
        routine: saved.routine === 'night' ? 'night' : 'day',
        motion: typeof saved.motion === 'boolean' ? saved.motion : defaults.motion,
        sound: typeof saved.sound === 'boolean' ? saved.sound : defaults.sound,
        haptic: typeof saved.haptic === 'boolean' ? saved.haptic : defaults.haptic,
        contrast: typeof saved.contrast === 'boolean' ? saved.contrast : defaults.contrast,
        feeling: ['calm', 'wiggly', 'tired', 'big', 'sad', 'angry', 'hungry', 'thirsty', 'loud', 'sore', 'toilet', 'worried'].includes(saved.feeling) ? saved.feeling : null,
        character: validCharacter ? savedCharacter : 'battery',
        glyph: /^([A-Z]|10|[1-9])$/.test(saved.glyph || '') ? saved.glyph : 'A'
      };
    } catch (_error) {
      return { ...defaults };
    }
  }

  let state = loadState();
  window.leonSalState = state;
  let energyAnimation = 0;
  let audioContext = null;
  let announceTimer = 0;

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_error) {
      // The experience still works when private browsing blocks storage.
    }
  }

  function announce(message) {
    if (!elements.liveRegion) return;
    window.clearTimeout(announceTimer);
    elements.liveRegion.textContent = '';
    announceTimer = window.setTimeout(() => {
      elements.liveRegion.textContent = message;
    }, 30);
  }

  function vibrate(pattern = 18) {
    if (state.haptic && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  function playTone(type = 'tap') {
    if (!state.sound) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      audioContext = audioContext || new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(type === 'success' ? 440 : 330, now);
      if (type === 'success') oscillator.frequency.linearRampToValueAtTime(540, now + 0.18);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'success' ? 0.34 : 0.18));
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + (type === 'success' ? 0.36 : 0.2));
    } catch (_error) {
      // Audio is optional. A blocked audio API never blocks play.
    }
  }

  function energyProfile(value) {
    const profile = window.LeonSalCharacters.energyProfile(value, state.character);
    const colours = {
      empty: '#e96a62',
      low: '#ef8d4a',
      calm: '#d7ad35',
      happy: '#348de3',
      excited: '#46b668'
    };
    return {
      ...profile,
      colour: colours[profile.state] || '#348de3'
    };
  }

  function renderTheme() {
    const night = state.routine === 'night';
    elements.body.classList.toggle('night-mode', night);
    elements.body.classList.toggle('high-contrast', state.contrast);
    elements.body.classList.toggle('calm-motion', !state.motion);
    elements.skySymbol.textContent = night ? '🌙' : '☀️';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#111a2f' : '#eef7ff');
  }

  function renderEnergy() {
    const value = Math.round(state.energy);
    const profile = energyProfile(value);
    const sleeping = profile.state === 'empty';

    elements.root.style.setProperty('--energy', `${value}%`);
    elements.root.style.setProperty('--energy-colour', profile.colour);
    elements.energySlider.value = String(value);
    elements.energySlider.setAttribute('aria-valuetext', `${profile.label}, ${value} percent, ${window.LeonSalCharacters.displayNameForCharacter(state.character)}`);
    elements.energyNumber.textContent = `${value}%`;
    elements.energyState.textContent = profile.label;
    elements.energyPill.textContent = `${value}% full`;
    elements.energyMessage.textContent = profile.message;
    elements.headerStatus.textContent = profile.header;

    elements.energyBuddy.classList.toggle('is-sleeping', profile.state === 'empty');
    elements.energyBuddy.classList.toggle('is-tired', profile.state === 'low');
    elements.energyBuddy.classList.toggle('is-charged', profile.state === 'excited');
    elements.characterStage.classList.toggle('is-sleeping', sleeping);
    elements.characterStage.dataset.energyState = profile.className;
  }

  function setEnergy(value, options = {}) {
    state.energy = clamp(Number(value) || 0, 0, 100);
    renderEnergy();
    if (options.persist !== false) saveState();
  }

  function cancelEnergyAnimation() {
    if (energyAnimation) {
      window.cancelAnimationFrame(energyAnimation);
      energyAnimation = 0;
    }
  }

  function animateEnergy(target, duration = 1600, onComplete) {
    cancelEnergyAnimation();
    const startValue = state.energy;
    const destination = clamp(target, 0, 100);

    if (!state.motion || prefersReducedMotion.matches || duration <= 0 || startValue === destination) {
      setEnergy(destination);
      if (onComplete) onComplete();
      return;
    }

    const started = performance.now();
    const ease = (progress) => 1 - Math.pow(1 - progress, 3);

    const frame = (now) => {
      const progress = clamp((now - started) / duration, 0, 1);
      setEnergy(startValue + ((destination - startValue) * ease(progress)), { persist: false });
      if (progress < 1) {
        energyAnimation = window.requestAnimationFrame(frame);
      } else {
        energyAnimation = 0;
        setEnergy(destination);
        if (onComplete) onComplete();
      }
    };

    energyAnimation = window.requestAnimationFrame(frame);
  }

  function setToggle(button, enabled, onText, offText) {
    button.setAttribute('aria-checked', String(enabled));
    const label = button.querySelector('span:last-child');
    if (label) label.textContent = enabled ? onText : offText;
  }

  function renderSettings() {
    setToggle(elements.motionToggle, state.motion, 'Gentle motion', 'Motion paused');
    setToggle(elements.soundToggle, state.sound, 'Sound on', 'Sound off');
    setToggle(elements.hapticToggle, state.haptic, 'Vibration on', 'Vibration off');
    setToggle(elements.contrastToggle, state.contrast, 'Strong contrast', 'Contrast normal');
    renderTheme();
  }

  elements.energySlider.addEventListener('input', (event) => {
    cancelEnergyAnimation();
    setEnergy(event.currentTarget.value);
  });

  elements.energySlider.addEventListener('change', () => {
    const profile = energyProfile(state.energy);
    announce(`${profile.label}. ${window.LeonSalCharacters.displayNameForCharacter(state.character)} is ${Math.round(state.energy)} percent.`);
    vibrate(12);
    playTone('tap');
  });

  elements.bedtimeButton.addEventListener('click', () => {
    state.routine = 'night';
    renderTheme();
    saveState();
    playTone('tap');
    vibrate(18);
    animateEnergy(0, 1800, () => announce(`Bedtime. ${window.LeonSalCharacters.displayNameForCharacter(state.character)} is resting.`));
  });

  elements.morningButton.addEventListener('click', () => {
    state.routine = 'day';
    renderTheme();
    saveState();
    playTone('success');
    vibrate([15, 45, 15]);
    animateEnergy(100, 2100, () => announce(`Good morning. ${window.LeonSalCharacters.displayNameForCharacter(state.character)} is fully charged.`));
  });

  elements.motionToggle.addEventListener('click', () => {
    state.motion = !state.motion;
    renderSettings();
    saveState();
    announce(state.motion ? 'Gentle motion is on.' : 'Motion is paused.');
  });

  elements.soundToggle.addEventListener('click', () => {
    state.sound = !state.sound;
    renderSettings();
    saveState();
    if (state.sound) playTone('success');
    announce(state.sound ? 'Sound is on. Sounds only follow your taps.' : 'Sound is off.');
  });

  elements.hapticToggle.addEventListener('click', () => {
    state.haptic = !state.haptic;
    renderSettings();
    saveState();
    if (state.haptic) vibrate(22);
    announce(state.haptic ? 'Vibration is on.' : 'Vibration is off.');
  });

  elements.contrastToggle.addEventListener('click', () => {
    state.contrast = !state.contrast;
    renderSettings();
    saveState();
    announce(state.contrast ? 'Strong contrast is on.' : 'Strong contrast is off.');
  });

  // Feelings are a child-controlled visual metaphor, not a score or assessment.
  const feelingChoices = {
    calm: {
      energy: 60,
      panel: 'breathe',
      message: 'Calm selected. Breathe & Charge is open, or you can choose any game.'
    },
    wiggly: {
      energy: 78,
      panel: 'dash',
      message: 'Wiggly selected. Dash is open for some controlled movement.'
    },
    tired: {
      energy: 18,
      panel: 'bubbles',
      message: 'Tired selected. Quiet Bubbles is open, and Bedtime Rest is nearby.'
    },
    big: {
      energy: 32,
      panel: 'draw',
      message: 'Big feelings selected. Finger Light Trail is open with no timer or score.'
    },
    sad: {
      energy: 30,
      panel: 'draw',
      message: 'Sad selected. A grown-up can stay close while you make a gentle light trail.'
    },
    angry: {
      energy: 48,
      panel: 'breathe',
      message: 'Angry selected. You can make space and try a slow breath when ready.'
    },
    hungry: {
      energy: 25,
      panel: 'pattern',
      message: 'Hungry selected. Please show a grown-up that you want food.'
    },
    thirsty: {
      energy: 28,
      panel: 'bubbles',
      message: 'Thirsty selected. Please show a grown-up that you want a drink.'
    },
    loud: {
      energy: 22,
      panel: 'bubbles',
      message: 'Too loud selected. Motion is calmer and Quiet Bubbles is open.'
    },
    sore: {
      energy: 20,
      panel: 'breathe',
      message: 'Something hurts selected. Use Show Me Where below and tell a grown-up.'
    },
    toilet: {
      energy: 35,
      panel: 'dash',
      message: 'Toilet selected. Please show a grown-up that you need the toilet.'
    },
    worried: {
      energy: 30,
      panel: 'breathe',
      message: 'Worried selected. A grown-up can stay close while you breathe slowly.'
    }
  };

  function renderFeeling(feeling, options = {}) {
    $$('.feeling-button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.feeling === feeling));
    });

    if (!feeling || !feelingChoices[feeling]) {
      elements.feelingSuggestion.textContent = 'Choose a feeling when you are ready.';
      return;
    }

    const choice = feelingChoices[feeling];
    elements.feelingSuggestion.textContent = choice.message;
    if (options.openPanel !== false) selectPanel(choice.panel, false);
  }

  $$('.feeling-button').forEach((button) => {
    button.addEventListener('click', () => {
      const feeling = button.dataset.feeling;
      const choice = feelingChoices[feeling];
      state.feeling = feeling;
      setEnergy(choice.energy, { persist: false });
      renderFeeling(feeling);
      saveState();
      playTone('tap');
      vibrate(14);
      announce(choice.message);
    });
  });

  // Accessible tabs: click/tap and arrow keys both work.
  const activityTabs = $$('.activity-tab');
  const activityPanels = $$('.activity-panel');

  function selectPanel(name, moveFocus = false) {
    const selectedTab = activityTabs.find((tab) => tab.dataset.panel === name) || activityTabs[0];
    activityTabs.forEach((tab) => {
      const selected = tab === selectedTab;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    activityPanels.forEach((panel) => {
      const selected = panel.id === `panel-${selectedTab.dataset.panel}`;
      panel.hidden = !selected;
      panel.classList.toggle('is-active', selected);
    });
    if (moveFocus) selectedTab.focus();
    if (selectedTab.dataset.panel === 'draw') {
      window.setTimeout(resizeTrailCanvas, 0);
    }
    if (selectedTab.dataset.panel === 'dash') {
      window.setTimeout(() => updateDash(Number(elements.dashSlider.value), { award: false }), 0);
    }
  }

  activityTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      selectPanel(tab.dataset.panel, false);
      playTone('tap');
      vibrate(10);
    });
    tab.addEventListener('keydown', (event) => {
      let nextIndex = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % activityTabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + activityTabs.length) % activityTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = activityTabs.length - 1;
      if (nextIndex !== null) {
        event.preventDefault();
        selectPanel(activityTabs[nextIndex].dataset.panel, true);
      }
    });
  });
