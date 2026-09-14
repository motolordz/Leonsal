'use strict';

(() => {
  const STATES = [
    ['empty', 0],
    ['low', 25],
    ['calm', 50],
    ['happy', 75],
    ['excited', 100]
  ];
  const stateLabels = {
    empty: 'Empty',
    low: 'Low',
    calm: 'Calm',
    happy: 'Happy',
    excited: 'Excited'
  };
  const palettes = {
    guide: ['#2f7df6', '#ffe26a', '#ff6ab0'],
    alphabet: ['#6e6ef7', '#ffca3a', '#3bd982'],
    number: ['#13a0db', '#ffda58', '#ff7a59'],
    world: ['#32c36b', '#ffcf48', '#32a7ff'],
    planet: ['#686de0', '#9be7ff', '#ffd166']
  };
  const stateTone = {
    empty: { eye: 'closed', mouth: 'sleep', lean: -5, lift: 10, glow: 0, label: 'sleepy' },
    low: { eye: 'tired', mouth: 'soft', lean: -2, lift: 4, glow: .15, label: 'waking' },
    calm: { eye: 'open', mouth: 'smile', lean: 0, lift: 0, glow: .25, label: 'ready' },
    happy: { eye: 'open', mouth: 'happy', lean: 2, lift: -5, glow: .45, label: 'happy' },
    excited: { eye: 'bright', mouth: 'excited', lean: 4, lift: -9, glow: .7, label: 'excited' }
  };
  const svgNS = 'http://www.w3.org/2000/svg';
  const grid = document.getElementById('characterWorldGrid');
  const selectedHost = document.getElementById('selectedCharacterCard');
  const energy = document.getElementById('characterEnergy');
  const energyValue = document.getElementById('characterEnergyValue');
  const statePicker = document.getElementById('statePicker');
  const stateRunway = document.getElementById('characterStateRunway');
  const count = document.getElementById('characterCount');
  const runtimeTruth = document.getElementById('characterRuntimeTruth');
  const libraryProgress = document.getElementById('characterLibraryProgress');
  const familyButtons = [...document.querySelectorAll('[data-family-filter]')];
  const statusButtons = [...document.querySelectorAll('[data-status-filter]')];
  const playScene = document.querySelector('.character-chase-scene');
  const playModeButtons = [...document.querySelectorAll('.play-mode-picker [data-play-mode]')];
  let characters = [];
  let selected = null;
  let filter = 'all';
  let statusFilter = 'all';
  let settings = null;
  let gridPreviewState = 'calm';

  const stateForEnergy = value => {
    const percent = Number(value);
    if (typeof LeonSalV2 !== 'undefined') return LeonSalV2.stateForEnergy(percent);
    if (percent < 20) return 'empty';
    if (percent < 40) return 'low';
    if (percent < 65) return 'calm';
    if (percent < 90) return 'happy';
    return 'excited';
  };
  const normalFamily = record => record.family === 'numbers' ? 'number' : record.family;
  const allRecords = registry => {
    const priority = { guides: 0, alphabet: 1, numbers: 2, world: 3, planets: 4, pilot: 5 };
    const records = ['guides', 'alphabet', 'numbers', 'world', 'planets', 'pilot']
      .flatMap(group => (registry[group] || []).map(item => ({ ...item, family: normalFamily(item), registryGroup: group })))
      .sort((left, right) => (priority[left.registryGroup] ?? 9) - (priority[right.registryGroup] ?? 9));
    const byId = new Map();
    for (const record of records) {
      if (!byId.has(record.id)) byId.set(record.id, record);
    }
    return [...byId.values()];
  };
  const renderRuntimeTruth = registry => {
    if (!runtimeTruth) return;
    const records = allRecords(registry);
    const approvedStates = records
      .filter(item => item.status === 'approved')
      .reduce((sum, item) => sum + Object.values(item.states || {}).filter(state => state?.webPath || state?.web || state?.src).length, 0);
    const pendingStates = records
      .filter(item => item.status !== 'approved')
      .reduce((sum, item) => sum + Object.keys(item.states || {}).length, 0);
    runtimeTruth.innerHTML = `<article><strong>${approvedStates}</strong><span>approved runtime states</span></article><article><strong>${pendingStates}</strong><span>pending review states</span></article><p>Only approved artwork can become a runtime image. Everything else uses this safe vector fallback.</p>`;
  };
  const renderLibraryProgress = registry => {
    if (!libraryProgress) return;
    const records = allRecords(registry);
    const approved = records.filter(item => item.status === 'approved').length;
    const pending = records.length - approved;
    const families = [
      ['guide', 'Leon & Zaya'],
      ['alphabet', 'A-Z'],
      ['number', '1-10'],
      ['world', 'World'],
      ['planet', 'Planets']
    ].map(([family, label]) => {
      const familyRecords = records.filter(item => item.family === family);
      return `<span><strong>${familyRecords.length}</strong>${label}</span>`;
    }).join('');
    libraryProgress.innerHTML = `<div>${families}</div><small>${approved} approved · ${pending} pending vector previews</small>`;
  };
  const displayInitial = record => {
    if (record.uppercase) return record.uppercase;
    if (/^number-/.test(record.id)) return record.id.replace('number-', '');
    if (/battery/i.test(record.id)) return 'BAT';
    if (/sun/i.test(record.id)) return 'SUN';
    if (/moon/i.test(record.id)) return 'MOON';
    if (/cloud/i.test(record.id)) return 'CLOUD';
    if (/rainbow/i.test(record.id)) return 'RAIN';
    if (/(^|-)plane($|-)/i.test(record.id)) return 'JET';
    if (/rocket/i.test(record.id)) return 'GO';
    if (/bus|double-decker/i.test(record.id)) return 'BUS';
    if (/boat/i.test(record.id)) return 'BOAT';
    if (/tree/i.test(record.id)) return 'TREE';
    if (/robot/i.test(record.id)) return 'BOT';
    if (/elephant/i.test(record.id)) return 'E';
    return (record.displayName || record.id || '?').slice(0, 1).toUpperCase();
  };
  const safeText = text => String(text || '').replace(/[<&]/g, '');
  const characterKind = record => {
    const id = record.id || '';
    if (record.family === 'guide') return record.id === 'zaya' ? 'zaya' : 'leon';
    if (record.family === 'alphabet') return 'letter';
    if (record.family === 'number') return 'number';
    if (/elephant/.test(id)) return 'elephant';
    if (/battery/.test(id)) return 'battery';
    if (/dinosaur/.test(id)) return 'dinosaur';
    if (/bus|train|double-decker/.test(id)) return 'vehicle';
    if (/(^|-)plane($|-)/.test(id) || /rocket|boat/.test(id)) return 'transport';
    if (/sun|moon|earth|planet|mercury|venus|mars|jupiter|saturn|uranus|neptune/.test(id)) return 'planet';
    if (/cloud|rainbow|water|tree/.test(id)) return 'nature';
    if (/robot|magnifier|pencil|book|paintbrush|music|clock|calendar|puzzle|treasure/.test(id)) return 'object';
    return 'buddy';
  };
  const bodyMarkupFor = (record, family, glyph, primary, accent, secondary) => {
    const kind = characterKind(record);
    if (kind === 'battery') {
      return `
        <g class="character-body battery-body">
          <rect x="62" y="48" width="96" height="130" rx="24" class="body"/>
          <rect x="86" y="32" width="48" height="24" rx="9" fill="${secondary}" stroke="#173356" stroke-width="5"/>
          <path d="M92 114 l24 -43 -1 31 h22 l-30 48 5 -36z" fill="${accent}" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
          <circle cx="76" cy="121" r="9" class="cheek"/><circle cx="159" cy="121" r="9" class="cheek"/>
        </g>`;
    }
    if (kind === 'letter' || kind === 'number') {
      const fontSize = kind === 'number' && glyph.length > 1 ? 82 : 102;
      return `
        <g class="character-body letter-number-body">
          <text x="110" y="142" text-anchor="middle" class="glyph" style="font-size:${fontSize}px">${glyph}</text>
          <circle cx="76" cy="121" r="10" class="cheek"/>
          <circle cx="159" cy="121" r="10" class="cheek"/>
        </g>`;
    }
    if (kind === 'leon' || kind === 'zaya') {
      const shirt = kind === 'zaya' ? '#ff5dab' : '#1872e8';
      const hair = kind === 'zaya' ? '#4a2418' : '#1d1512';
      const name = kind === 'zaya' ? 'ZAYA' : 'LEON';
      const bow = kind === 'zaya' ? '<path d="M80 35 q-26 -18 -34 7 q21 18 42 6zM140 35 q26 -18 34 7 q-21 18 -42 6z" fill="#ff5dab"/>' : '<path d="M66 45 q44 -42 93 0 q-38 -18 -93 0z" fill="#12355e"/>';
      return `
        <g class="character-body guide-body">
          <circle cx="110" cy="83" r="47" fill="#ffc58d"/>
          <path d="M66 71 q32 -48 88 -22 q14 10 19 33 q-44 -22 -107 -11z" fill="${hair}"/>
          ${bow}
          <path d="M63 132 q47 -24 94 0 l20 54 q-67 25 -134 0z" fill="${shirt}"/>
          <text x="110" y="169" text-anchor="middle" class="guide-name">${name}</text>
          <circle cx="77" cy="104" r="9" class="cheek"/>
          <circle cx="145" cy="104" r="9" class="cheek"/>
        </g>`;
    }
    if (kind === 'elephant') {
      return `
        <g class="character-body elephant-body">
          <ellipse cx="66" cy="105" rx="34" ry="46" fill="#ff9db3"/>
          <ellipse cx="154" cy="105" rx="34" ry="46" fill="#ff9db3"/>
          <circle cx="110" cy="102" r="58" class="body"/>
          <path d="M111 121 q4 31 -20 51 q26 12 43 -6 q-10 -24 -4 -45z" fill="${primary}" stroke="#173356" stroke-width="5" stroke-linecap="round"/>
          <circle cx="76" cy="121" r="10" class="cheek"/>
          <circle cx="159" cy="121" r="10" class="cheek"/>
        </g>`;
    }
    if (kind === 'dinosaur') {
      return `
        <g class="character-body dinosaur-body">
          <path d="M69 112 q9 -53 62 -53 q43 0 54 43 q-11 56 -69 68 q-43 -5 -47 -58z" class="body"/>
          <path d="M83 67 l13 -23 12 25M115 58 l14 -24 12 27M149 74 l15 -20 8 27" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/>
          <path d="M61 137 q-30 8 -41 33" fill="none" stroke="${primary}" stroke-width="15" stroke-linecap="round"/>
          <circle cx="76" cy="121" r="9" class="cheek"/><circle cx="159" cy="121" r="9" class="cheek"/>
        </g>`;
    }
    if (kind === 'vehicle') {
      return `
        <g class="character-body vehicle-body">
          <rect x="45" y="76" width="130" height="77" rx="18" class="body"/>
          <rect x="55" y="87" width="110" height="24" rx="8" fill="#dff5ff" opacity=".9"/>
          <path d="M58 122 h104" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55"/>
          <circle cx="78" cy="158" r="14" fill="#173356"/><circle cx="142" cy="158" r="14" fill="#173356"/>
          <circle cx="76" cy="121" r="8" class="cheek"/><circle cx="159" cy="121" r="8" class="cheek"/>
        </g>`;
    }
    if (kind === 'transport') {
      return `
        <g class="character-body transport-body">
          <path d="M45 119 q62 -67 128 0 q-45 30 -128 0z" class="body"/>
          <path d="M91 68 l45 104" stroke="${accent}" stroke-width="15" stroke-linecap="round" opacity=".7"/>
          <circle cx="76" cy="121" r="9" class="cheek"/><circle cx="159" cy="121" r="9" class="cheek"/>
        </g>`;
    }
    if (kind === 'planet') {
      return `
        <g class="character-body planet-body">
          <ellipse cx="110" cy="112" rx="82" ry="24" fill="none" stroke="${accent}" stroke-width="12" opacity=".72"/>
          <circle cx="110" cy="108" r="58" class="body"/>
          <path d="M67 118 q42 20 88 -6" fill="none" stroke="#fff" stroke-width="9" opacity=".35"/>
          <circle cx="76" cy="121" r="10" class="cheek"/><circle cx="159" cy="121" r="10" class="cheek"/>
        </g>`;
    }
    if (kind === 'nature') {
      return `
        <g class="character-body nature-body">
          <path d="M110 40 q45 19 56 64 q-11 55 -56 77 q-45 -22 -56 -77 q11 -45 56 -64z" class="body"/>
          <path d="M80 138 q35 18 70 0" fill="none" stroke="#fff" stroke-width="10" opacity=".32"/>
          <circle cx="76" cy="121" r="10" class="cheek"/><circle cx="159" cy="121" r="10" class="cheek"/>
        </g>`;
    }
    if (kind === 'object') {
      return `
        <g class="character-body object-body">
          <rect x="55" y="58" width="110" height="110" rx="32" class="body"/>
          <text x="110" y="137" text-anchor="middle" class="object-glyph">${glyph}</text>
          <circle cx="76" cy="121" r="10" class="cheek"/><circle cx="159" cy="121" r="10" class="cheek"/>
        </g>`;
    }
    return `
      <g class="character-body buddy-body">
        <circle cx="110" cy="111" r="54" class="body"/>
        <text x="110" y="132" text-anchor="middle" class="object-glyph">${glyph}</text>
        <circle cx="76" cy="121" r="10" class="cheek"/>
        <circle cx="159" cy="121" r="10" class="cheek"/>
      </g>`;
  };

  function makeSvg(record, state, options = {}) {
    const sharedRenderer = window.LeonSalCharacterRenderer;
    if (sharedRenderer) {
      const svg = sharedRenderer.makeCharacter(record, state, options);
      if (svg) {
        svg.classList.add('procedural-character-svg', `character-family-${record.family}`, `character-state-${state}`);
        return svg;
      }
    }
    const family = record.family || 'world';
    const [primary, accent, secondary] = palettes[family] || palettes.world;
    const tone = stateTone[state] || stateTone.calm;
    const glyph = safeText(displayInitial(record));
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 220 220');
    svg.setAttribute('role', options.decorative ? 'presentation' : 'img');
    if (!options.decorative) {
      svg.setAttribute('aria-label', `${record.displayName || record.id} ${stateLabels[state]} vector preview`);
    }
    svg.classList.add('procedural-character-svg', `character-family-${family}`, `character-state-${state}`);
    const glowOpacity = String(tone.glow);
    const eyeMarkup = {
      closed: '<path d="M78 98 q14 11 28 0" class="eye-line"/><path d="M130 98 q14 11 28 0" class="eye-line"/>',
      tired: '<path d="M76 94 q15 -7 31 0" class="brow"/><path d="M128 94 q15 -7 31 0" class="brow"/><ellipse cx="92" cy="106" rx="12" ry="8" class="eye"/><ellipse cx="144" cy="106" rx="12" ry="8" class="eye"/>',
      open: '<ellipse cx="92" cy="101" rx="15" ry="18" class="eye"/><ellipse cx="144" cy="101" rx="15" ry="18" class="eye"/><circle cx="97" cy="94" r="4" class="catch"/><circle cx="149" cy="94" r="4" class="catch"/>',
      bright: '<ellipse cx="92" cy="97" rx="17" ry="20" class="eye"/><ellipse cx="144" cy="97" rx="17" ry="20" class="eye"/><circle cx="98" cy="89" r="5" class="catch"/><circle cx="150" cy="89" r="5" class="catch"/>'
    }[tone.eye] || '';
    const mouthMarkup = {
      sleep: '<path d="M103 137 q15 -10 30 0" class="mouth sleep-mouth"/>',
      soft: '<path d="M101 136 q17 13 35 0" class="mouth soft-mouth"/>',
      smile: '<path d="M96 135 q22 20 46 0" class="mouth"/>',
      happy: '<path d="M91 132 q27 30 58 0" class="mouth"/><path d="M102 137 q18 14 36 0" class="mouth-fill"/>',
      excited: '<path d="M88 129 q30 40 64 0" class="mouth"/><path d="M101 140 q18 20 39 0" class="mouth-fill"/>'
    }[tone.mouth] || '';
    const bodyShape = bodyMarkupFor(record, family, glyph, primary, accent, secondary);
    svg.innerHTML = `
      <defs>
        <radialGradient id="shine-${record.id}-${state}" cx="35%" cy="22%">
          <stop offset="0" stop-color="#fff" stop-opacity=".9"/>
          <stop offset=".42" stop-color="${primary}" stop-opacity=".92"/>
          <stop offset="1" stop-color="${secondary}" stop-opacity=".96"/>
        </radialGradient>
        <filter id="soft-shadow-${record.id}-${state}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#163f6d" flood-opacity=".18"/>
        </filter>
      </defs>
      <g transform="translate(0 ${tone.lift}) rotate(${tone.lean} 110 112)" filter="url(#soft-shadow-${record.id}-${state})">
        <ellipse cx="110" cy="187" rx="58" ry="13" fill="#163f6d" opacity=".12"/>
        <circle cx="110" cy="108" r="76" fill="${accent}" opacity="${glowOpacity}"/>
        ${bodyShape}
        <g class="character-face">
          ${eyeMarkup}
          ${mouthMarkup}
        </g>
        <path d="M62 145 q-26 11 -33 33" class="limb"/>
        <path d="M158 145 q28 8 35 32" class="limb"/>
        <path d="M86 169 q-11 16 -26 23" class="limb"/>
        <path d="M134 169 q12 17 28 23" class="limb"/>
        ${state === 'excited' ? '<path d="M35 61 l9 17 19 2 -14 12 4 19 -16 -10 -17 9 5 -19 -14 -13 19 -1z" class="spark"/><path d="M174 47 l6 13 15 2 -11 10 3 15 -13 -8 -13 7 4 -15 -11 -10 15 -1z" class="spark small"/>' : ''}
        ${state === 'empty' ? '<text x="160" y="55" class="sleep-z">z</text><text x="176" y="42" class="sleep-z small">z</text>' : ''}
      </g>`;
    svg.style.setProperty('--pc-primary', primary);
    svg.style.setProperty('--pc-accent', accent);
    svg.style.setProperty('--pc-secondary', secondary);
    return svg;
  }

  function renderSelected() {
    if (!selected) return;
    const state = stateForEnergy(energy.value);
    gridPreviewState = state;
    energyValue.textContent = `${energy.value}%`;
    selectedHost.replaceChildren();
    const figure = document.createElement('figure');
    figure.append(makeSvg(selected, state));
    const caption = document.createElement('figcaption');
    caption.innerHTML = `<strong>${selected.displayName}</strong><span>${stateLabels[state]} · ${stateTone[state].label}</span><small>${selected.status === 'approved' ? 'Approved artwork may render in games.' : 'Procedural vector fallback. Final art pending.'}</small>`;
    figure.append(caption);
    selectedHost.append(figure);
    for (const button of statePicker.children) {
      button.setAttribute('aria-pressed', String(button.dataset.state === state));
    }
    for (const card of grid.children) {
      card.classList.toggle('is-selected', card.dataset.character === selected.id);
    }
    renderStateRunway(state);
  }

  function renderStateRunway(activeState = stateForEnergy(energy.value)) {
    if (!stateRunway || !selected) return;
    stateRunway.replaceChildren(...STATES.map(([state, value]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'character-runway-state';
      button.dataset.state = state;
      button.setAttribute('aria-pressed', String(state === activeState));
      button.setAttribute('aria-label', `${selected.displayName} ${stateLabels[state]} ${value} percent`);
      button.append(makeSvg(selected, state, { decorative: true }));
      const label = document.createElement('span');
      label.innerHTML = `<strong>${value}%</strong><small>${stateLabels[state]}</small>`;
      button.append(label);
      button.addEventListener('click', () => {
        energy.value = String(value);
        renderSelected();
        renderGrid();
      });
      return button;
    }));
  }

  function renderStatePicker() {
    statePicker.replaceChildren(...STATES.map(([state, value]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.state = state;
      button.setAttribute('aria-label', `${stateLabels[state]} ${value} percent`);
      button.append(makeSvg(selected || characters[0], state, { decorative: true }));
      const label = document.createElement('span');
      label.textContent = `${value}%`;
      button.append(label);
      button.addEventListener('click', () => {
        energy.value = String(value);
        renderSelected();
        renderGrid();
      });
      return button;
    }));
  }

  function renderGrid() {
    const previewState = gridPreviewState || stateForEnergy(energy.value);
    const visible = characters.filter(item => {
      const familyMatch = filter === 'all' || item.family === filter;
      const statusMatch = statusFilter === 'all'
        || (statusFilter === 'approved' && item.status === 'approved')
        || (statusFilter === 'pending' && item.status !== 'approved');
      return familyMatch && statusMatch;
    });
    count.textContent = `${visible.length} shown`;
    if (!visible.length) {
      const empty = document.createElement('article');
      empty.className = 'character-world-empty';
      empty.innerHTML = '<strong>No approved art here yet.</strong><span>Try all artwork to see the safe vector previews.</span>';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Show all artwork';
      button.addEventListener('click', () => {
        statusFilter = 'all';
        statusButtons.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.statusFilter === 'all')));
        renderGrid();
      });
      empty.append(button);
      grid.replaceChildren(empty);
      return;
    }
    grid.replaceChildren(...visible.map(record => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'character-world-card';
      button.dataset.character = record.id;
      button.dataset.family = record.family;
      button.dataset.status = record.status === 'approved' ? 'approved' : 'pending';
      button.dataset.previewState = previewState;
      button.append(makeSvg(record, previewState));
      const label = document.createElement('strong');
      label.textContent = record.displayName;
      const detail = document.createElement('span');
      detail.textContent = `${stateLabels[previewState]} ${record.status === 'approved' ? 'approved art' : 'vector fallback'}`;
      const stateStrip = document.createElement('span');
      stateStrip.className = 'character-card-state-strip';
      stateStrip.setAttribute('aria-label', `${record.displayName} has empty, low, calm, happy, and excited states`);
      stateStrip.innerHTML = STATES.map(([state, value]) => `<i data-state="${state}" title="${stateLabels[state]} ${value}%"></i>`).join('');
      button.append(label, detail, stateStrip);
      button.addEventListener('click', () => {
        selected = record;
        renderStatePicker();
        renderSelected();
      });
      return button;
    }));
    renderSelected();
  }

  async function init() {
    try {
      if (typeof LeonSalV2 !== 'undefined' && typeof LeonSalGameShell !== 'undefined') {
        settings = new LeonSalV2.SensorySettings();
        new LeonSalV2.SettingsPanel(document.querySelector('#settings'), settings, { keys: LeonSalGameShell.sensoryKeys });
        document.querySelector('#settingsToggle').addEventListener('click', () => {
          const panel = document.querySelector('#settings');
          const open = panel.dataset.open !== 'true';
          panel.dataset.open = String(open);
          document.querySelector('#settingsToggle').setAttribute('aria-expanded', String(open));
        });
        new LeonSalGameShell({ settings, reset: () => {
          energy.value = '50';
          selected = characters.find(item => item.id === 'leon') || characters[0] || selected;
          renderStatePicker();
          renderGrid();
        } });
      }
      const response = await fetch('data/character-assets.json');
      if (!response.ok) throw new Error('registry unavailable');
      const registry = await response.json();
      renderRuntimeTruth(registry);
      renderLibraryProgress(registry);
      characters = allRecords(registry).filter(item => item.id && item.displayName);
      selected = characters.find(item => item.id === 'leon') || characters[0];
      document.querySelector('[data-chase-character="leon"]').append(makeSvg(characters.find(item => item.id === 'leon') || selected, 'happy', { decorative: true }));
      document.querySelector('[data-chase-character="zaya"]').append(makeSvg(characters.find(item => item.id === 'zaya') || selected, 'excited', { decorative: true }));
      renderStatePicker();
      renderGrid();
      energy.addEventListener('input', () => {
        renderSelected();
        renderGrid();
      });
      familyButtons.forEach(button => {
        button.addEventListener('click', () => {
          filter = button.dataset.familyFilter;
          familyButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
          renderGrid();
        });
      });
      statusButtons.forEach(button => {
        button.addEventListener('click', () => {
          statusFilter = button.dataset.statusFilter;
          statusButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
          renderGrid();
        });
      });
      playModeButtons.forEach(button => {
        button.addEventListener('click', () => {
          playScene.dataset.playMode = button.dataset.playMode;
          playModeButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        });
      });
    } catch {
      selectedHost.textContent = 'Character world could not load.';
      count.textContent = 'Unavailable';
    }
  }

  init();
})();
