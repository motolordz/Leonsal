'use strict';

(() => {
  const svgNS = 'http://www.w3.org/2000/svg';
  const guideModels = {
    leon: { shirt: '#1872e8', hair: '#1d1512', name: 'Leon', accessory: 'headband' },
    zaya: { shirt: '#ff5dab', hair: '#4a2418', name: 'Zaya', accessory: 'bows' }
  };
  const palettes = {
    alphabet: ['#6e6ef7', '#ffca3a', '#3bd982'],
    number: ['#13a0db', '#ffda58', '#ff7a59'],
    world: ['#32c36b', '#ffcf48', '#32a7ff'],
    planet: ['#686de0', '#9be7ff', '#ffd166']
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
    if (/battery/i.test(record.id)) return 'BAT';
    if (/sun/i.test(record.id)) return 'SUN';
    if (/moon/i.test(record.id)) return 'MOON';
    if (/cloud/i.test(record.id)) return 'CLOUD';
    if (/rainbow/i.test(record.id)) return 'RAIN';
    if (/(^|-)plane($|-)/i.test(record.id)) return 'JET';
    if (/rocket/i.test(record.id)) return 'GO';
    if (/bus|double-decker/i.test(record.id)) return 'BUS';
    if (/boat/i.test(record.id)) return 'BOAT';
    if (/owl/i.test(record.id)) return 'OWL';
    if (/fish/i.test(record.id)) return 'FISH';
    if (/lizard/i.test(record.id)) return 'LIZ';
    if (/penguin/i.test(record.id)) return 'P';
    if (/tree/i.test(record.id)) return 'TREE';
    if (/robot/i.test(record.id)) return 'BOT';
    if (/elephant/i.test(record.id)) return 'E';
    return (record.displayName || record.id || '?').slice(0, 1).toUpperCase();
  }

  function characterKind(record) {
    const id = record.id || '';
    if (record.family === 'alphabet') return 'letter';
    if (record.family === 'number' || record.family === 'numbers') return 'number';
    if (/rainbow/.test(id)) return 'rainbow';
    if (/cloud/.test(id)) return 'cloud';
    if (/moon/.test(id)) return 'moon';
    if (/sun/.test(id) && !/^planet-/.test(id)) return 'sun';
    if (/rocket/.test(id)) return 'rocket';
    if (/tree/.test(id)) return 'tree';
    if (/earth/.test(id)) return 'earth';
    if (/robot/.test(id)) return 'robot';
    if (/magnifier/.test(id)) return 'magnifier';
    if (/puzzle/.test(id)) return 'puzzle';
    if (/train/.test(id)) return 'train';
    if (/(^|-)plane($|-)/.test(id)) return 'plane';
    if (/boat/.test(id)) return 'boat';
    if (/clock/.test(id)) return 'clock';
    if (/calendar/.test(id)) return 'calendar';
    if (/pencil/.test(id)) return 'pencil';
    if (/book/.test(id)) return 'book';
    if (/paintbrush/.test(id)) return 'paintbrush';
    if (/music/.test(id)) return 'music';
    if (/water/.test(id)) return 'water';
    if (/treasure/.test(id)) return 'treasure';
    if (/elephant/.test(id)) return 'elephant';
    if (/battery/.test(id)) return 'battery';
    if (/dinosaur/.test(id)) return 'dinosaur';
    if (/owl|fish|lizard|penguin/.test(id)) return 'animal';
    if (/bus|double-decker/.test(id)) return 'double-decker';
    if (/rocket/.test(id)) return 'transport';
    if (/sun|moon|earth|planet|mercury|venus|mars|jupiter|saturn|uranus|neptune/.test(id)) return 'planet';
    if (/cloud|rainbow|water|tree/.test(id)) return 'nature';
    if (/robot|magnifier|pencil|book|paintbrush|music|clock|calendar|puzzle|treasure/.test(id)) return 'object';
    return 'buddy';
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
        <text x="110" y="168" text-anchor="middle" class="guide-name">${guide.name.toUpperCase()}</text>
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

  function worldBodyMarkup(record, glyph, primary, accent, secondary) {
    const kind = characterKind(record);
    if (kind === 'sun') {
      return `<g class="character-body sun-body"><path d="M110 29 l12 27 29 -11 -11 29 27 12 -27 12 11 29 -29 -11 -12 27 -12 -27 -29 11 11 -29 -27 -12 27 -12 -11 -29 29 11z" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><circle cx="110" cy="108" r="52" class="body"/><circle cx="76" cy="121" r="9" class="cheek"/><circle cx="159" cy="121" r="9" class="cheek"/></g>`;
    }
    if (kind === 'moon') {
      return `<g class="character-body moon-body"><path d="M142 50 q-42 9 -49 54 q-7 48 34 72 q-48 2 -72 -35 q-20 -32 -5 -66 q20 -45 92 -25z" class="body"/><circle cx="74" cy="123" r="9" class="cheek"/><circle cx="134" cy="121" r="9" class="cheek"/></g>`;
    }
    if (kind === 'cloud') {
      return `<g class="character-body cloud-body"><path d="M61 139 q-24 -4 -25 -30 q1 -24 26 -29 q11 -31 43 -31 q30 0 45 25 q31 0 39 28 q8 34 -28 40z" class="body"/><circle cx="75" cy="124" r="9" class="cheek"/><circle cx="154" cy="124" r="9" class="cheek"/></g>`;
    }
    if (kind === 'rainbow') {
      return `<g class="character-body rainbow-body"><path d="M42 141 q68 -102 136 0" fill="none" stroke="#ff5dab" stroke-width="42" stroke-linecap="round"/><path d="M58 141 q52 -76 104 0" fill="none" stroke="#ffcf48" stroke-width="30" stroke-linecap="round"/><path d="M74 141 q36 -51 72 0" fill="none" stroke="#32c36b" stroke-width="18" stroke-linecap="round"/><path d="M90 141 q20 -28 40 0" fill="none" stroke="#32a7ff" stroke-width="9" stroke-linecap="round"/><circle cx="67" cy="147" r="22" fill="#fff"/><circle cx="153" cy="147" r="22" fill="#fff"/><circle cx="80" cy="128" r="9" class="cheek"/><circle cx="140" cy="128" r="9" class="cheek"/></g>`;
    }
    if (kind === 'rocket') {
      return `<g class="character-body rocket-body"><path d="M111 38 q43 33 35 99 q-35 32 -70 0 q-8 -66 35 -99z" class="body"/><circle cx="111" cy="89" r="22" fill="#dff5ff" stroke="#173356" stroke-width="5"/><path d="M76 127 l-31 28 q-2 -34 20 -52zM146 127 l31 28 q2 -34 -20 -52z" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><path d="M92 151 q19 32 38 0" fill="#ff7a59" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><circle cx="82" cy="121" r="8" class="cheek"/><circle cx="140" cy="121" r="8" class="cheek"/></g>`;
    }
    if (kind === 'tree') {
      return `<g class="character-body tree-body"><path d="M100 124 h22 l12 54 h-46z" fill="#9a6739" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><circle cx="83" cy="96" r="34" class="body"/><circle cx="117" cy="76" r="40" class="body"/><circle cx="145" cy="105" r="34" class="body"/><path d="M86 135 q25 14 55 0" fill="none" stroke="#fff" stroke-width="9" opacity=".28"/><circle cx="76" cy="121" r="9" class="cheek"/><circle cx="155" cy="121" r="9" class="cheek"/></g>`;
    }
    if (kind === 'earth') {
      return `<g class="character-body earth-body"><circle cx="110" cy="108" r="60" class="body"/><path d="M78 84 q22 -24 44 -7 q-18 18 7 31 q-20 13 -42 0 q-20 -10 -9 -24zM133 126 q24 -17 43 4 q-12 27 -48 27 q-13 -17 5 -31z" fill="#45bd6b" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M58 111 q50 20 104 0" fill="none" stroke="#fff" stroke-width="8" opacity=".28"/><circle cx="76" cy="123" r="9" class="cheek"/><circle cx="159" cy="123" r="9" class="cheek"/></g>`;
    }
    if (kind === 'robot') {
      return `<g class="character-body robot-body"><rect x="58" y="65" width="104" height="96" rx="26" class="body"/><rect x="82" y="43" width="56" height="24" rx="12" fill="${accent}" stroke="#173356" stroke-width="5"/><path d="M110 43 v-20" stroke="#173356" stroke-width="7" stroke-linecap="round"/><circle cx="110" cy="20" r="8" fill="${accent}" stroke="#173356" stroke-width="4"/><rect x="76" y="120" width="68" height="18" rx="9" fill="#fff" opacity=".75"/><circle cx="76" cy="113" r="8" class="cheek"/><circle cx="159" cy="113" r="8" class="cheek"/></g>`;
    }
    if (kind === 'magnifier') {
      return `<g class="character-body magnifier-body"><circle cx="94" cy="91" r="48" fill="#dff5ff" stroke="#173356" stroke-width="12"/><path d="M130 127 l49 49" stroke="${primary}" stroke-width="19" stroke-linecap="round"/><path d="M130 127 l49 49" stroke="#173356" stroke-width="7" stroke-linecap="round" opacity=".42"/><circle cx="72" cy="112" r="8" class="cheek"/><circle cx="117" cy="112" r="8" class="cheek"/></g>`;
    }
    if (kind === 'puzzle') {
      return `<g class="character-body puzzle-body"><path d="M68 58 h32 q-4 22 15 22 q19 0 15 -22 h32 v38 q-22 -5 -22 14 q0 20 22 16 v38 h-38 q4 -23 -15 -23 q-20 0 -16 23 h-35 v-38 q23 4 23 -16 q0 -19 -23 -14z" class="body"/><circle cx="82" cy="122" r="8" class="cheek"/><circle cx="151" cy="122" r="8" class="cheek"/></g>`;
    }
    if (kind === 'train') {
      return `<g class="character-body train-body"><rect x="45" y="90" width="122" height="62" rx="18" class="body"/><rect x="62" y="62" width="58" height="38" rx="12" fill="${accent}" stroke="#173356" stroke-width="5"/><rect x="71" y="73" width="38" height="20" rx="7" fill="#dff5ff"/><path d="M47 126 h118" stroke="#fff" stroke-width="8" opacity=".55"/><circle cx="72" cy="158" r="15" fill="#173356"/><circle cx="139" cy="158" r="15" fill="#173356"/><path d="M151 79 q20 -18 35 2" fill="none" stroke="${secondary}" stroke-width="9" stroke-linecap="round"/><circle cx="78" cy="122" r="8" class="cheek"/><circle cx="148" cy="122" r="8" class="cheek"/></g>`;
    }
    if (kind === 'double-decker') {
      const isHongKong = /hong|hk/i.test(record.id || '');
      const isNight = /night|nite/i.test(record.id || '');
      const busTop = isHongKong ? '#22c55e' : isNight ? '#2563eb' : '#ef4444';
      const busBottom = isHongKong ? '#16a34a' : isNight ? '#1d4ed8' : '#dc2626';
      const stripe = isHongKong ? '#facc15' : '#fff7ed';
      return `<g class="character-body vehicle-body double-decker-body">
        <rect x="42" y="58" width="136" height="96" rx="19" fill="${busTop}" stroke="#173356" stroke-width="6"/>
        <path d="M43 105 h134 v29 q0 20 -20 20 h-94 q-20 0 -20 -20z" fill="${busBottom}" stroke="#173356" stroke-width="6" stroke-linejoin="round"/>
        <rect x="55" y="69" width="110" height="28" rx="8" fill="#dff5ff" opacity=".95"/>
        <rect x="57" y="112" width="106" height="23" rx="8" fill="#dff5ff" opacity=".92"/>
        <path d="M73 70 v26M98 70 v26M124 70 v26M149 70 v26M82 113 v22M110 113 v22M138 113 v22" stroke="#173356" stroke-width="3" opacity=".22"/>
        <path d="M51 105 h119M55 139 h108" stroke="${stripe}" stroke-width="6" stroke-linecap="round" opacity=".9"/>
        <rect x="90" y="61" width="42" height="18" rx="7" fill="#173356" opacity=".9"/>
        <text x="111" y="75" text-anchor="middle" fill="#fff" font-size="12" font-weight="1000">${isHongKong ? 'HK' : isNight ? 'NITE' : 'UK'}</text>
        <circle cx="75" cy="159" r="15" fill="#173356"/>
        <circle cx="145" cy="159" r="15" fill="#173356"/>
        <circle cx="75" cy="159" r="7" fill="#e5e7eb"/>
        <circle cx="145" cy="159" r="7" fill="#e5e7eb"/>
        <circle cx="82" cy="122" r="8" class="cheek"/>
        <circle cx="151" cy="122" r="8" class="cheek"/>
      </g>`;
    }
    if (kind === 'plane') {
      return `<g class="character-body plane-body"><path d="M38 119 q62 -58 145 -13 q-38 42 -145 13z" class="body"/><path d="M98 79 l26 -42 q16 38 6 71zM101 132 l18 42 q20 -30 15 -55z" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><circle cx="157" cy="103" r="12" fill="#dff5ff" stroke="#173356" stroke-width="5"/><circle cx="76" cy="121" r="8" class="cheek"/><circle cx="137" cy="114" r="8" class="cheek"/></g>`;
    }
    if (kind === 'boat') {
      return `<g class="character-body boat-body"><path d="M48 125 h127 q-12 45 -64 51 q-48 -5 -63 -51z" class="body"/><path d="M110 54 v70" stroke="#173356" stroke-width="8" stroke-linecap="round"/><path d="M111 60 q40 19 46 62 h-46z" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><path d="M107 68 q-34 15 -43 54 h43z" fill="#fff" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><circle cx="79" cy="135" r="8" class="cheek"/><circle cx="146" cy="135" r="8" class="cheek"/></g>`;
    }
    if (kind === 'clock') {
      return `<g class="character-body clock-body"><circle cx="110" cy="108" r="60" class="body"/><circle cx="110" cy="108" r="45" fill="#fff" opacity=".9" stroke="#173356" stroke-width="5"/><path d="M110 108 v-28M110 108 l28 18" stroke="#173356" stroke-width="8" stroke-linecap="round"/><circle cx="76" cy="124" r="9" class="cheek"/><circle cx="159" cy="124" r="9" class="cheek"/></g>`;
    }
    if (kind === 'calendar') {
      return `<g class="character-body calendar-body"><rect x="55" y="55" width="110" height="118" rx="18" class="body"/><path d="M55 86 h110" stroke="#fff" stroke-width="14" opacity=".65"/><path d="M78 44 v28M142 44 v28" stroke="#173356" stroke-width="10" stroke-linecap="round"/><circle cx="85" cy="125" r="8" fill="#fff" opacity=".8"/><circle cx="112" cy="125" r="8" fill="#fff" opacity=".8"/><circle cx="139" cy="125" r="8" fill="#fff" opacity=".8"/><circle cx="76" cy="116" r="8" class="cheek"/><circle cx="159" cy="116" r="8" class="cheek"/></g>`;
    }
    if (kind === 'pencil') {
      return `<g class="character-body pencil-body"><path d="M60 137 l62 -86 q16 5 31 22 l-64 85z" class="body"/><path d="M122 51 l20 -23 q19 7 31 23 l-20 22z" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><path d="M60 137 l-16 36 45 -15z" fill="#ffe8bd" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><circle cx="87" cy="122" r="8" class="cheek"/><circle cx="130" cy="120" r="8" class="cheek"/></g>`;
    }
    if (kind === 'book') {
      return `<g class="character-body book-body"><path d="M51 62 q34 -16 59 8 q25 -24 59 -8 v112 q-34 -16 -59 8 q-25 -24 -59 -8z" class="body"/><path d="M110 70 v112" stroke="#fff" stroke-width="8" opacity=".55"/><path d="M67 91 h27M126 91 h27M67 115 h24M126 115 h24" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".72"/><circle cx="78" cy="128" r="8" class="cheek"/><circle cx="145" cy="128" r="8" class="cheek"/></g>`;
    }
    if (kind === 'paintbrush') {
      return `<g class="character-body paintbrush-body"><path d="M75 151 q38 -78 83 -115 q21 16 25 34 q-62 35 -108 81z" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><path d="M59 165 q10 -46 44 -41 q10 35 -44 41z" class="body"/><path d="M52 172 q21 11 46 -11" fill="none" stroke="#173356" stroke-width="6" stroke-linecap="round"/><circle cx="86" cy="124" r="8" class="cheek"/><circle cx="129" cy="120" r="8" class="cheek"/></g>`;
    }
    if (kind === 'music') {
      return `<g class="character-body music-body"><path d="M98 53 h50 v86" fill="none" stroke="${primary}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="80" cy="146" rx="30" ry="24" class="body"/><ellipse cx="142" cy="139" rx="30" ry="24" class="body"/><path d="M98 53 v91" stroke="#173356" stroke-width="5" opacity=".45"/><circle cx="73" cy="133" r="8" class="cheek"/><circle cx="143" cy="126" r="8" class="cheek"/></g>`;
    }
    if (kind === 'water') {
      return `<g class="character-body water-body"><path d="M110 39 q57 70 57 103 q0 42 -57 42 q-57 0 -57 -42 q0 -33 57 -103z" class="body"/><path d="M82 137 q28 18 59 0" fill="none" stroke="#fff" stroke-width="9" opacity=".35"/><circle cx="76" cy="124" r="9" class="cheek"/><circle cx="159" cy="124" r="9" class="cheek"/></g>`;
    }
    if (kind === 'treasure') {
      return `<g class="character-body treasure-body"><path d="M55 102 q8 -45 55 -45 q47 0 55 45z" class="body"/><rect x="49" y="101" width="122" height="70" rx="15" class="body"/><path d="M49 115 h122M110 58 v113" stroke="#ffcf48" stroke-width="10" opacity=".85"/><rect x="97" y="112" width="26" height="26" rx="6" fill="${accent}" stroke="#173356" stroke-width="5"/><circle cx="76" cy="130" r="8" class="cheek"/><circle cx="159" cy="130" r="8" class="cheek"/></g>`;
    }
    if (kind === 'battery') {
      return `<g class="character-body battery-body"><rect x="62" y="48" width="96" height="130" rx="24" class="body"/><rect x="86" y="32" width="48" height="24" rx="9" fill="${secondary}" stroke="#173356" stroke-width="5"/><path d="M92 114 l24 -43 -1 31 h22 l-30 48 5 -36z" fill="${accent}" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><circle cx="76" cy="121" r="9" class="cheek"/><circle cx="159" cy="121" r="9" class="cheek"/></g>`;
    }
    if (kind === 'elephant') {
      return `<g class="character-body elephant-body"><ellipse cx="66" cy="105" rx="34" ry="46" fill="#ff9db3"/><ellipse cx="154" cy="105" rx="34" ry="46" fill="#ff9db3"/><circle cx="110" cy="102" r="58" class="body"/><path d="M111 121 q4 31 -20 51 q26 12 43 -6 q-10 -24 -4 -45z" fill="${primary}" stroke="#173356" stroke-width="5" stroke-linecap="round"/><circle cx="76" cy="121" r="10" class="cheek"/><circle cx="159" cy="121" r="10" class="cheek"/></g>`;
    }
    if (kind === 'dinosaur') {
      return `<g class="character-body dinosaur-body"><path d="M69 112 q9 -53 62 -53 q43 0 54 43 q-11 56 -69 68 q-43 -5 -47 -58z" class="body"/><path d="M83 67 l13 -23 12 25M115 58 l14 -24 12 27M149 74 l15 -20 8 27" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><path d="M61 137 q-30 8 -41 33" fill="none" stroke="${primary}" stroke-width="15" stroke-linecap="round"/><circle cx="76" cy="121" r="9" class="cheek"/><circle cx="159" cy="121" r="9" class="cheek"/></g>`;
    }
    if (kind === 'vehicle') {
      return `<g class="character-body vehicle-body"><rect x="45" y="76" width="130" height="77" rx="18" class="body"/><rect x="55" y="87" width="110" height="24" rx="8" fill="#dff5ff" opacity=".9"/><path d="M58 122 h104" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55"/><circle cx="78" cy="158" r="14" fill="#173356"/><circle cx="142" cy="158" r="14" fill="#173356"/><circle cx="76" cy="121" r="8" class="cheek"/><circle cx="159" cy="121" r="8" class="cheek"/></g>`;
    }
    if (kind === 'transport') {
      return `<g class="character-body transport-body"><path d="M45 119 q62 -67 128 0 q-45 30 -128 0z" class="body"/><path d="M91 68 l45 104" stroke="${accent}" stroke-width="15" stroke-linecap="round" opacity=".7"/><circle cx="76" cy="121" r="9" class="cheek"/><circle cx="159" cy="121" r="9" class="cheek"/></g>`;
    }
    if (kind === 'animal') {
      if (/fish/.test(record.id)) {
        return `<g class="character-body animal-body fish-body"><path d="M55 112 q45 -48 104 0 q-58 46 -104 0z" class="body"/><path d="M159 112 l32 -27 q8 28 0 54z" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><path d="M93 75 q12 15 24 0" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/><circle cx="76" cy="121" r="9" class="cheek"/><circle cx="145" cy="121" r="9" class="cheek"/></g>`;
      }
      if (/lizard/.test(record.id)) {
        return `<g class="character-body animal-body lizard-body"><ellipse cx="112" cy="115" rx="62" ry="43" class="body"/><path d="M58 126 q-25 8 -37 27" fill="none" stroke="${primary}" stroke-width="14" stroke-linecap="round"/><path d="M166 127 q22 7 34 25" fill="none" stroke="${primary}" stroke-width="12" stroke-linecap="round"/><path d="M82 77 l10 -19 11 20M128 77 l10 -19 11 20" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><circle cx="76" cy="121" r="9" class="cheek"/><circle cx="159" cy="121" r="9" class="cheek"/></g>`;
      }
      if (/penguin/.test(record.id)) {
        return `<g class="character-body animal-body penguin-body"><ellipse cx="110" cy="112" rx="54" ry="70" fill="#173356"/><ellipse cx="110" cy="126" rx="35" ry="42" fill="#fff" opacity=".92"/><path d="M99 116 l11 12 12 -12" fill="${accent}" stroke="#173356" stroke-width="4" stroke-linejoin="round"/><path d="M70 132 q-28 18 -41 43" class="limb"/><path d="M150 132 q28 18 41 43" class="limb"/><circle cx="78" cy="123" r="8" class="cheek"/><circle cx="158" cy="123" r="8" class="cheek"/></g>`;
      }
      return `<g class="character-body animal-body owl-body"><ellipse cx="110" cy="114" rx="58" ry="65" class="body"/><path d="M62 74 q23 -29 48 0 q25 -29 48 0 q-18 -9 -48 -6 q-30 -3 -48 6z" fill="${accent}" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><path d="M98 118 l12 15 13 -15" fill="${secondary}" stroke="#173356" stroke-width="4" stroke-linejoin="round"/><circle cx="76" cy="121" r="9" class="cheek"/><circle cx="159" cy="121" r="9" class="cheek"/></g>`;
    }
    if (kind === 'planet') {
      if (/planet-sun/.test(record.id)) {
        return `<g class="character-body planet-body planet-sun-body"><path d="M110 24 l12 28 30 -13 -9 32 31 10 -30 15 14 29 -33 -7 -15 31 -17 -30 -32 9 12 -31 -29 -13 30 -12 -10 -32 30 12z" fill="#ffcf48" stroke="#173356" stroke-width="5" stroke-linejoin="round"/><circle cx="110" cy="108" r="53" fill="#ffdf5a" stroke="#173356" stroke-width="6"/><circle cx="76" cy="121" r="10" class="cheek"/><circle cx="159" cy="121" r="10" class="cheek"/></g>`;
      }
      if (/mercury/.test(record.id)) {
        return `<g class="character-body planet-body planet-mercury-body"><circle cx="110" cy="108" r="57" fill="#b6a899" stroke="#173356" stroke-width="6"/><circle cx="83" cy="84" r="8" fill="#8f8174" opacity=".45"/><circle cx="137" cy="132" r="11" fill="#8f8174" opacity=".35"/><circle cx="74" cy="124" r="9" class="cheek"/><circle cx="159" cy="124" r="9" class="cheek"/></g>`;
      }
      if (/venus/.test(record.id)) {
        return `<g class="character-body planet-body planet-venus-body"><circle cx="110" cy="108" r="58" fill="#f2b35d" stroke="#173356" stroke-width="6"/><path d="M59 100 q45 -20 102 0M61 126 q44 18 99 0M78 78 q35 12 72 0" fill="none" stroke="#ffe4a6" stroke-width="8" stroke-linecap="round" opacity=".8"/><circle cx="75" cy="122" r="9" class="cheek"/><circle cx="159" cy="122" r="9" class="cheek"/></g>`;
      }
      if (/mars/.test(record.id)) {
        return `<g class="character-body planet-body planet-mars-body"><circle cx="110" cy="108" r="58" fill="#e56c47" stroke="#173356" stroke-width="6"/><path d="M70 86 q29 20 68 7M83 145 q34 -22 70 -7" fill="none" stroke="#ffb17d" stroke-width="9" stroke-linecap="round" opacity=".78"/><circle cx="139" cy="91" r="10" fill="#b94738" opacity=".36"/><circle cx="75" cy="122" r="9" class="cheek"/><circle cx="159" cy="122" r="9" class="cheek"/></g>`;
      }
      if (/jupiter/.test(record.id)) {
        return `<g class="character-body planet-body planet-jupiter-body"><circle cx="110" cy="108" r="61" fill="#d79b64" stroke="#173356" stroke-width="6"/><path d="M52 81 h116M50 105 h120M56 130 h108" stroke="#ffe2b8" stroke-width="11" stroke-linecap="round" opacity=".86"/><ellipse cx="144" cy="121" rx="18" ry="12" fill="#c64b3c" stroke="#fff" stroke-width="4"/><circle cx="75" cy="123" r="8" class="cheek"/><circle cx="159" cy="123" r="8" class="cheek"/></g>`;
      }
      if (/saturn/.test(record.id)) {
        return `<g class="character-body planet-body planet-saturn-body"><ellipse cx="110" cy="114" rx="90" ry="25" fill="none" stroke="#ffd166" stroke-width="13" opacity=".86"/><path d="M29 119 q80 -20 162 0" fill="none" stroke="#173356" stroke-width="5" opacity=".28"/><circle cx="110" cy="108" r="55" fill="#eecb75" stroke="#173356" stroke-width="6"/><path d="M67 98 q42 13 87 0" fill="none" stroke="#fff0b5" stroke-width="8" stroke-linecap="round" opacity=".72"/><circle cx="75" cy="123" r="9" class="cheek"/><circle cx="159" cy="123" r="9" class="cheek"/></g>`;
      }
      if (/uranus/.test(record.id)) {
        return `<g class="character-body planet-body planet-uranus-body"><ellipse cx="111" cy="109" rx="22" ry="82" fill="none" stroke="#b9f6ff" stroke-width="9" opacity=".78" transform="rotate(18 111 109)"/><circle cx="110" cy="108" r="57" fill="#8fe7ec" stroke="#173356" stroke-width="6"/><path d="M66 112 q43 16 89 0" fill="none" stroke="#eaffff" stroke-width="9" stroke-linecap="round" opacity=".72"/><circle cx="75" cy="123" r="9" class="cheek"/><circle cx="159" cy="123" r="9" class="cheek"/></g>`;
      }
      if (/neptune/.test(record.id)) {
        return `<g class="character-body planet-body planet-neptune-body"><circle cx="110" cy="108" r="58" fill="#3c76db" stroke="#173356" stroke-width="6"/><path d="M69 92 q34 22 82 8M75 137 q32 -16 78 -5" fill="none" stroke="#9be7ff" stroke-width="9" stroke-linecap="round" opacity=".75"/><circle cx="80" cy="78" r="9" fill="#244fb5" opacity=".42"/><circle cx="75" cy="122" r="9" class="cheek"/><circle cx="159" cy="122" r="9" class="cheek"/></g>`;
      }
      return `<g class="character-body planet-body"><ellipse cx="110" cy="112" rx="82" ry="24" fill="none" stroke="${accent}" stroke-width="12" opacity=".72"/><circle cx="110" cy="108" r="58" class="body"/><path d="M67 118 q42 20 88 -6" fill="none" stroke="#fff" stroke-width="9" opacity=".35"/><circle cx="76" cy="121" r="10" class="cheek"/><circle cx="159" cy="121" r="10" class="cheek"/></g>`;
    }
    if (kind === 'nature') {
      return `<g class="character-body nature-body"><path d="M110 40 q45 19 56 64 q-11 55 -56 77 q-45 -22 -56 -77 q11 -45 56 -64z" class="body"/><path d="M80 138 q35 18 70 0" fill="none" stroke="#fff" stroke-width="10" opacity=".32"/><circle cx="76" cy="121" r="10" class="cheek"/><circle cx="159" cy="121" r="10" class="cheek"/></g>`;
    }
    if (kind === 'object') {
      return `<g class="character-body object-body"><rect x="55" y="58" width="110" height="110" rx="32" class="body"/><text x="110" y="137" text-anchor="middle" class="object-glyph">${glyph}</text><circle cx="76" cy="121" r="10" class="cheek"/><circle cx="159" cy="121" r="10" class="cheek"/></g>`;
    }
    return `<g class="character-body buddy-body"><circle cx="110" cy="111" r="54" class="body"/><text x="110" y="132" text-anchor="middle" class="object-glyph">${glyph}</text><circle cx="76" cy="121" r="10" class="cheek"/><circle cx="159" cy="121" r="10" class="cheek"/></g>`;
  }

  function makeWorldCharacter(record, state = 'happy', options = {}) {
    const family = record.family === 'planet' || record.family === 'planets' ? 'planet' : 'world';
    const [primary, accent, secondary] = palettes[family] || palettes.world;
    const emotion = emotions[state] || emotions.happy;
    const glyph = safeText(displayGlyph(record));
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
        <radialGradient id="worldCharacter-${record.id}-${state}" cx="35%" cy="22%">
          <stop offset="0" stop-color="#fff" stop-opacity=".9"/>
          <stop offset=".42" stop-color="${primary}" stop-opacity=".92"/>
          <stop offset="1" stop-color="${secondary}" stop-opacity=".96"/>
        </radialGradient>
        <filter id="worldCharacterShadow-${record.id}-${state}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#163f6d" flood-opacity=".18"/>
        </filter>
      </defs>
      <g transform="translate(0 ${emotion.lift}) rotate(${emotion.lean} 110 112)" filter="url(#worldCharacterShadow-${record.id}-${state})">
        <ellipse cx="110" cy="187" rx="58" ry="13" fill="#163f6d" opacity=".12"/>
        <circle cx="110" cy="108" r="76" fill="${accent}" opacity="${emotion.glow}"/>
        ${worldBodyMarkup(record, glyph, primary, accent, secondary)}
        <g class="character-face">${eyeMarkup(emotion.eye)}${mouthMarkup(emotion.mouth)}</g>
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
    if (record.family === 'world' || record.family === 'planet' || record.family === 'planets' || record.registryGroup === 'world' || record.registryGroup === 'planets' || record.registryGroup === 'pilot') {
      return makeWorldCharacter(record, state, options);
    }
    return null;
  }

  window.LeonSalCharacterRenderer = Object.freeze({
    makeCharacter,
    makeGuide,
    makeLearningGlyph,
    makeWorldCharacter,
    supportedGuideStates: Object.freeze(Object.keys(emotions))
  });
})();
