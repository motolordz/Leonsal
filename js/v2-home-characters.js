'use strict';

(() => {
  const svgNS = 'http://www.w3.org/2000/svg';
  const states = {
    leon: { shirt: '#1872e8', hair: '#1d1512', name: 'Leon', lean: 5, lift: -4 },
    zaya: { shirt: '#ff5dab', hair: '#4a2418', name: 'Zaya', lean: -5, lift: -8 }
  };

  function makeGuide(id) {
    const guide = states[id] || states.leon;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 220 220');
    svg.setAttribute('role', 'presentation');
    svg.classList.add('home-guide-svg', `home-guide-${id}`);
    svg.innerHTML = `
      <filter id="homeGuideShadow-${id}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="7" flood-color="#143a6d" flood-opacity=".2"/>
      </filter>
      <g transform="translate(0 ${guide.lift}) rotate(${guide.lean} 110 112)" filter="url(#homeGuideShadow-${id})">
        <ellipse cx="110" cy="188" rx="58" ry="13" fill="#143a6d" opacity=".14"/>
        <circle cx="110" cy="83" r="47" fill="#ffc58d"/>
        <path d="M66 71 q32 -48 88 -22 q14 10 19 33 q-44 -22 -107 -11z" fill="${guide.hair}"/>
        ${id === 'zaya' ? '<path d="M80 35 q-26 -18 -34 7 q21 18 42 6zM140 35 q26 -18 34 7 q-21 18 -42 6z" fill="#ff5dab"/>' : '<path d="M66 45 q44 -42 93 0 q-38 -18 -93 0z" fill="#12355e"/>'}
        <circle cx="92" cy="97" r="14" fill="#173356"/>
        <circle cx="142" cy="97" r="14" fill="#173356"/>
        <circle cx="98" cy="90" r="4" fill="#fff"/>
        <circle cx="148" cy="90" r="4" fill="#fff"/>
        <circle cx="77" cy="111" r="9" fill="#ff8fb1" opacity=".58"/>
        <circle cx="145" cy="111" r="9" fill="#ff8fb1" opacity=".58"/>
        <path d="M88 130 q30 36 64 0" fill="none" stroke="#173356" stroke-width="8" stroke-linecap="round"/>
        <path d="M101 139 q18 18 39 0" fill="#ff775f" opacity=".9"/>
        <path d="M63 132 q47 -24 94 0 l20 54 q-67 25 -134 0z" fill="${guide.shirt}"/>
        <path d="M68 145 q-33 -12 -43 20" fill="none" stroke="#ffc58d" stroke-width="13" stroke-linecap="round"/>
        <path d="M153 145 q35 -13 45 17" fill="none" stroke="#ffc58d" stroke-width="13" stroke-linecap="round"/>
        <path d="M83 179 q-16 12 -27 27" fill="none" stroke="#1f4d8d" stroke-width="15" stroke-linecap="round"/>
        <path d="M137 179 q18 10 30 25" fill="none" stroke="#1f4d8d" stroke-width="15" stroke-linecap="round"/>
        <path d="M110 134 l8 16 18 2 -13 12 4 18 -17 -9 -16 9 3 -18 -13 -12 18 -2z" fill="#ffcf48" stroke="#fff" stroke-width="3"/>
        <text x="110" y="168" text-anchor="middle" fill="#fff" stroke="rgba(20,58,109,.34)" stroke-width="2" paint-order="stroke" font-family="system-ui, sans-serif" font-size="24" font-weight="1000">${guide.name}</text>
      </g>`;
    return svg;
  }

  function install() {
    document.querySelectorAll('[data-home-guide]').forEach((target) => {
      target.setAttribute('data-svg-guide', 'true');
      const renderer = window.LeonSalCharacterRenderer;
      const guide = target.dataset.homeGuide;
      const state = guide === 'zaya' ? 'excited' : 'happy';
      target.replaceChildren(renderer ? renderer.makeGuide(guide, state, { decorative: true }) : makeGuide(guide));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
