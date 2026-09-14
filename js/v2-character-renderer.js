'use strict';

(() => {
  const svgNS = 'http://www.w3.org/2000/svg';
  const guideModels = {
    leon: { shirt: '#1872e8', hair: '#1d1512', name: 'Leon', accessory: 'headband' },
    zaya: { shirt: '#ff5dab', hair: '#4a2418', name: 'Zaya', accessory: 'bows' }
  };
  const palettes = {
    alphabet: ['#6e6ef7', '#ffca3a', '#3bd982'],
    number: ['#13a0db', '#ffda58', '#ff7a59']
  };
  const emotions = {
    empty: { eye: 'closed', mouth: 'sleep', lean: -5, lift: 8, arm: 'rest', glow: 0 },
    low: { eye: 'tired', mouth: 'soft', lean: -2, lift: 4, arm: 'rest', glow: .15 },
    calm: { eye: 'open', mouth: 'smile', lean: 0, lift: 0, arm: 'ready', glow: .25 },
    happy: { eye: 'open', mouth: 'happy', lean: 3, lift: -4, arm: 'wave', glow: .45 },
    excited: { eye: 'bright', mouth: 'excited', lean: 5, lift: -8, arm: 'celebrate', glow: .7 }
  };

  function safeText(text) {
    return String(text || '').replace(/[<&]/g, '');
  }

  function displayGlyph(record) {
    if (record.uppercase) return record.uppercase;
    if (/^number-/.test(record.id)) return record.id.replace('number-', '');
    return (record.displayName || record.id || '?').slice(0, 1).toUpperCase();
  }

  function eyeMarkup(kind) {
    if (kind === 'closed') {
      return '<path d="M78 100 q14 11 28 0" class="eye-line"/><path d="M130 100 q14 11 28 0" class="eye-line"/>';
    }
    if (kind === 'tired') {
      return '<path d="M76 92 q15 -7 31 0" class="brow"/><path d="M128 92 q15 -7 31 0" class="brow"/><ellipse cx="92" cy="106" rx="12" ry="8" class="eye"/><ellipse cx="144" cy="106" rx="12" ry="8" class="eye"/>';
    }
    if (kind === 'bright') {
      return '<ellipse cx="92" cy="96" rx="17" ry="20" class="eye"/><ellipse cx="144" cy="96" rx="17" ry="20" class="eye"/><circle cx="98" cy="88" r="5" class="catch"/><circle cx="150" cy="88" r="5" class="catch"/>';
    }
    return '<ellipse cx="92" cy="100" rx="15" ry="18" class="eye"/><ellipse cx="144" cy="100" rx="15" ry="18" class="eye"/><circle cx="97" cy="93" r="4" class="catch"/><circle cx="149" cy="93" r="4" class="catch"/>';
  }

  function mouthMarkup(kind) {
    if (kind === 'sleep') return '<path d="M103 137 q15 -10 30 0" class="mouth sleep-mouth"/>';
    if (kind === 'soft') return '<path d="M101 136 q17 13 35 0" class="mouth soft-mouth"/>';
    if (kind === 'happy') return '<path d="M91 132 q27 30 58 0" class="mouth"/><path d="M102 137 q18 14 36 0" class="mouth-fill"/>';
    if (kind === 'excited') return '<path d="M88 129 q30 40 64 0" class="mouth"/><path d="M101 140 q18 20 39 0" class="mouth-fill"/>';
    return '<path d="M96 135 q22 20 46 0" class="mouth"/>';
  }

  function armsMarkup(kind) {
    if (kind === 'celebrate') {
      return '<path d="M67 145 q-30 -28 -34 -65" class="skin-limb"/><path d="M153 145 q33 -28 38 -65" class="skin-limb"/>';
    }
    if (kind === 'wave') {
      return '<path d="M67 145 q-34 -20 -42 14" class="skin-limb"/><path d="M153 145 q34 -18 42 -52" class="skin-limb"/>';
    }
    if (kind === 'rest') {
      return '<path d="M68 145 q-24 13 -31 35" class="skin-limb"/><path d="M152 145 q25 13 32 35" class="skin-limb"/>';
    }
    return '<path d="M68 145 q-31 -7 -42 20" class="skin-limb"/><path d="M153 145 q32 -7 43 18" class="skin-limb"/>';
  }

  function makeGuide(id, state = 'happy', options = {}) {
    const guide = guideModels[id] || guideModels.leon;
    const emotion = emotions[state] || emotions.happy;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 220 220');
    svg.setAttribute('role', options.decorative ? 'presentation' : 'img');
    if (!options.decorative) svg.setAttribute('aria-label', `${guide.name} ${state}`);
    svg.classList.add('home-guide-svg', `home-guide-${id}`, `guide-state-${state}`);
    const accessory = guide.accessory === 'bows'
      ? '<path d="M80 35 q-26 -18 -34 7 q21 18 42 6zM140 35 q26 -18 34 7 q-21 18 -42 6z" fill="#ff5dab"/>'
      : '<path d="M65 50 q47 -27 96 0" fill="none" stroke="#1263cb" stroke-width="12" stroke-linecap="round"/><path d="M110 38 l8 16 18 2 -13 12 4 18 -17 -9 -16 9 3 -18 -13 -12 18 -2z" fill="#ffcf48" stroke="#fff" stroke-width="3"/>';
    svg.innerHTML = `
      <filter id="guideRendererShadow-${id}-${state}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="7" flood-color="#143a6d" flood-opacity=".2"/>
      </filter>
      <g transform="translate(0 ${emotion.lift}) rotate(${emotion.lean} 110 112)" filter="url(#guideRendererShadow-${id}-${state})">
        <ellipse cx="110" cy="188" rx="58" ry="13" fill="#143a6d" opacity=".14"/>
        <circle cx="110" cy="83" r="47" fill="#ffc58d"/>
        <path d="M66 71 q32 -48 88 -22 q14 10 19 33 q-44 -22 -107 -11z" fill="${guide.hair}"/>
        ${accessory}
        ${eyeMarkup(emotion.eye)}
        <circle cx="77" cy="111" r="9" fill="#ff8fb1" opacity=".58"/>
        <circle cx="145" cy="111" r="9" fill="#ff8fb1" opacity=".58"/>
        ${mouthMarkup(emotion.mouth)}
        <path d="M63 132 q47 -24 94 0 l20 54 q-67 25 -134 0z" fill="${guide.shirt}"/>
        ${armsMarkup(emotion.arm)}
        <path d="M83 179 q-16 12 -27 27" class="clothes-limb"/>
        <path d="M137 179 q18 10 30 25" class="clothes-limb"/>
        <path d="M110 134 l8 16 18 2 -13 12 4 18 -17 -9 -16 9 3 -18 -13 -12 18 -2z" fill="#ffcf48" stroke="#fff" stroke-width="3"/>
        <text x="110" y="168" text-anchor="middle" class="guide-name">${guide.name}</text>
      </g>`;
    return svg;
  }

  function makeLearningGlyph(record, state = 'happy', options = {}) {
    const family = record.family === 'numbers' ? 'number' : record.family;
    const [primary, accent, secondary] = palettes[family] || palettes.alphabet;
    const emotion = emotions[state] || emotions.happy;
    const glyph = safeText(displayGlyph(record));
    const fontSize = family === 'number' && glyph.length > 1 ? 82 : 104;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 220 220');
    svg.setAttribute('role', options.decorative ? 'presentation' : 'img');
    if (!options.decorative) svg.setAttribute('aria-label', `${record.displayName || glyph} ${state}`);
    svg.classList.add('procedural-character-svg', `character-family-${family}`, `character-state-${state}`);
    svg.style.setProperty('--pc-primary', primary);
    svg.style.setProperty('--pc-accent', accent);
    svg.style.setProperty('--pc-secondary', secondary);
    svg.innerHTML = `
      <defs>
        <radialGradient id="learningGlyph-${record.id}-${state}" cx="35%" cy="22%">
          <stop offset="0" stop-color="#fff" stop-opacity=".9"/>
          <stop offset=".45" stop-color="${primary}" stop-opacity=".92"/>
          <stop offset="1" stop-color="${secondary}" stop-opacity=".96"/>
        </radialGradient>
        <filter id="learningGlyphShadow-${record.id}-${state}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#163f6d" flood-opacity=".18"/>
        </filter>
      </defs>
      <g transform="translate(0 ${emotion.lift}) rotate(${emotion.lean} 110 112)" filter="url(#learningGlyphShadow-${record.id}-${state})">
        <ellipse cx="110" cy="187" rx="58" ry="13" fill="#163f6d" opacity=".12"/>
        <circle cx="110" cy="108" r="76" fill="${accent}" opacity="${emotion.glow}"/>
        <g class="character-body letter-number-body">
          <text x="110" y="142" text-anchor="middle" class="glyph" style="font-size:${fontSize}px">${glyph}</text>
          <circle cx="76" cy="121" r="10" class="cheek"/>
          <circle cx="159" cy="121" r="10" class="cheek"/>
        </g>
        <g class="character-face">
          ${eyeMarkup(emotion.eye)}
          ${mouthMarkup(emotion.mouth)}
        </g>
        ${armsMarkup(emotion.arm).replaceAll('skin-limb', 'limb')}
        <path d="M86 169 q-11 16 -26 23" class="limb"/>
        <path d="M134 169 q12 17 28 23" class="limb"/>
        ${state === 'excited' ? '<path d="M35 61 l9 17 19 2 -14 12 4 19 -16 -10 -17 9 5 -19 -14 -13 19 -1z" class="spark"/><path d="M174 47 l6 13 15 2 -11 10 3 15 -13 -8 -13 7 4 -15 -11 -10 15 -1z" class="spark small"/>' : ''}
        ${state === 'empty' ? '<text x="160" y="55" class="sleep-z">z</text><text x="176" y="42" class="sleep-z small">z</text>' : ''}
      </g>`;
    return svg;
  }

  function makeCharacter(record, state = 'happy', options = {}) {
    if (!record || !record.id) return makeGuide('leon', state, options);
    if (record.family === 'guide' && guideModels[record.id]) return makeGuide(record.id, state, options);
    if (record.family === 'alphabet' || record.family === 'number' || record.family === 'numbers') {
      return makeLearningGlyph(record, state, options);
    }
    return null;
  }

  window.LeonSalCharacterRenderer = Object.freeze({
    makeCharacter,
    makeGuide,
    makeLearningGlyph,
    supportedGuideStates: Object.freeze(Object.keys(emotions))
  });
})();
