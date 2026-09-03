(function () {
  'use strict';

  const registryUrl = 'data/character-assets.json';
  const aliases = {
    battery: 'battery-buddy',
    'battery-buddy': 'battery-buddy',
    elephant: 'elephant',
    bus: 'double-decker',
    'double-decker': 'double-decker',
    plane: 'plane',
    boat: 'boat',
    letter: 'letter-a',
    'letter-a': 'letter-a',
    leon: 'leon',
    zaya: 'zaya'
  };

  let registry = null;

  function allRecords() {
    if (!registry) return [];
    return [
      ...(registry.guides || []),
      ...(registry.world || []),
      ...(registry.alphabet || []),
      ...(registry.numbers || [])
    ];
  }

  function recordFor(value) {
    const canonical = aliases[value] || value;
    return allRecords().find((record) => record.id === canonical) || null;
  }

  function approvedPath(record, state) {
    if (!record || record.status !== 'approved' || !record.states) return null;
    return record.states[state] || null;
  }

  function renderThumbnails() {
    if (!registry) return;
    document.querySelectorAll('.character-choice[data-character]').forEach((button) => {
      const record = recordFor(button.dataset.character);
      const path = approvedPath(record, 'calm');
      let image = button.querySelector('.character-choice-art-v2');
      if (!path) {
        image?.remove();
        button.classList.remove('has-production-thumbnail-v2');
        return;
      }
      if (!image) {
        image = document.createElement('img');
        image.className = 'character-choice-art-v2';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.setAttribute('aria-hidden', 'true');
        button.prepend(image);
      }
      image.src = path;
      image.alt = '';
      button.classList.add('has-production-thumbnail-v2');
    });
  }

  function renderDash(detail) {
    const dash = document.getElementById('dashBuddy');
    if (!dash || !registry) return;

    const selected = detail?.id || window.leonSalState?.character || 'battery-buddy';
    const stateName = detail?.state ||
      window.LeonSalCharacters?.stateFromPercent?.(window.leonSalState?.energy ?? 68) ||
      'calm';
    const record = recordFor(selected);
    const path = approvedPath(record, stateName);

    if (!path) {
      dash.classList.remove('has-production-art-v2');
      dash.style.removeProperty('background-image');
      dash.style.removeProperty('background-size');
      dash.style.removeProperty('background-position');
      dash.style.removeProperty('background-repeat');
      return;
    }

    Array.from(dash.classList).forEach((className) => {
      if (className === 'sprite' || className === 'is-glyph' || className.startsWith('sprite-')) {
        dash.classList.remove(className);
      }
    });
    dash.classList.add('dash-buddy', 'has-production-art-v2');
    dash.textContent = '';
    dash.style.setProperty('background-image', `url("${path}")`, 'important');
    dash.style.setProperty('background-size', 'contain', 'important');
    dash.style.setProperty('background-position', 'center', 'important');
    dash.style.setProperty('background-repeat', 'no-repeat', 'important');
    dash.dataset.characterId = record.id;
    dash.dataset.characterState = stateName;
  }

  function preloadCurrentCharacter(detail) {
    const record = recordFor(detail?.id || window.leonSalState?.character || 'battery-buddy');
    if (!record || record.status !== 'approved') return;
    Object.values(record.states || {}).forEach((path) => {
      const image = new Image();
      image.src = path;
    });
  }

  function onCharacterChange(event) {
    const detail = event.detail || {};
    renderThumbnails();
    renderDash(detail);
    preloadCurrentCharacter(detail);
  }

  async function boot() {
    try {
      const response = await fetch(registryUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Character registry returned ${response.status}`);
      registry = await response.json();
      renderThumbnails();
      renderDash();
      preloadCurrentCharacter();
      window.addEventListener('leonsal:characterchange', onCharacterChange);
    } catch (error) {
      console.error('LeonSal character-art v2 enhancement failed:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
