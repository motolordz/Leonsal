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
  const count = document.getElementById('characterCount');
  const familyButtons = [...document.querySelectorAll('[data-family-filter]')];
  let characters = [];
  let selected = null;
  let filter = 'all';
  let settings = null;

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
  const displayInitial = record => {
    if (record.uppercase) return record.uppercase;
    if (/^number-/.test(record.id)) return record.id.replace('number-', '');
    if (/battery/i.test(record.id)) return 'BAT';
    if (/sun/i.test(record.id)) return 'SUN';
    if (/moon/i.test(record.id)) return 'MOON';
    if (/cloud/i.test(record.id)) return 'CLOUD';
    if (/rainbow/i.test(record.id)) return 'RAIN';
    if (/plane/i.test(record.id)) return 'JET';
    if (/rocket/i.test(record.id)) return '↑';
    if (/bus/i.test(record.id)) return 'BUS';
    if (/boat/i.test(record.id)) return 'BOAT';
    if (/tree/i.test(record.id)) return 'TREE';
    if (/robot/i.test(record.id)) return '▣';
    if (/elephant/i.test(record.id)) return 'E';
    return (record.displayName || record.id || '?').slice(0, 1).toUpperCase();
  };
  const safeText = text => String(text || '').replace(/[<&]/g, '');

  function makeSvg(record, state, options = {}) {
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
    const bodyShape = family === 'alphabet' || family === 'number'
      ? `<text x="110" y="142" text-anchor="middle" class="glyph">${glyph}</text>`
      : `<circle cx="110" cy="111" r="54" class="body"/><text x="110" y="132" text-anchor="middle" class="object-glyph">${glyph}</text>`;
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
        <g class="character-body">
          ${bodyShape}
          <circle cx="76" cy="121" r="10" class="cheek"/>
          <circle cx="159" cy="121" r="10" class="cheek"/>
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
      });
      return button;
    }));
  }

  function renderGrid() {
    const visible = characters.filter(item => filter === 'all' || item.family === filter);
    count.textContent = `${visible.length} shown`;
    grid.replaceChildren(...visible.map(record => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'character-world-card';
      button.dataset.character = record.id;
      button.dataset.family = record.family;
      button.append(makeSvg(record, 'calm'));
      const label = document.createElement('strong');
      label.textContent = record.displayName;
      const detail = document.createElement('span');
      detail.textContent = record.status === 'approved' ? 'Approved' : 'Five-state vector fallback';
      button.append(label, detail);
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
      characters = allRecords(registry).filter(item => item.id && item.displayName);
      selected = characters.find(item => item.id === 'leon') || characters[0];
      document.querySelector('[data-chase-character="leon"]').append(makeSvg(characters.find(item => item.id === 'leon') || selected, 'happy', { decorative: true }));
      document.querySelector('[data-chase-character="zaya"]').append(makeSvg(characters.find(item => item.id === 'zaya') || selected, 'excited', { decorative: true }));
      renderStatePicker();
      renderGrid();
      energy.addEventListener('input', renderSelected);
      familyButtons.forEach(button => {
        button.addEventListener('click', () => {
          filter = button.dataset.familyFilter;
          familyButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
          renderGrid();
        });
      });
    } catch {
      selectedHost.textContent = 'Character world could not load.';
      count.textContent = 'Unavailable';
    }
  }

  init();
})();
