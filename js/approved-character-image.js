'use strict';
// Public surfaces read only approved production states; no review fallback.
(async () => {
  const targets = document.querySelectorAll('[data-approved-character]');
  if (!targets.length) return;
  try {
    const response = await fetch('data/character-assets.json');
    if (!response.ok) throw new Error('Character registry unavailable');
    const registry = await response.json();
    const records = ['guides', 'alphabet', 'numbers', 'world', 'planets', 'pilot'].flatMap(key => registry[key] || []);
    for (const target of targets) {
      const record = records.find(item => item.id === target.dataset.approvedCharacter && item.status === 'approved');
      const src = record?.states?.[target.dataset.characterState || 'calm'];
      if (!src || !/^assets\/characters-v2\/[a-z0-9/_-]+\.webp$/i.test(src)) continue;
      const img = new Image();
      img.alt = ''; img.width = 180; img.height = 180;
      img.src = src;
      try { await img.decode(); target.replaceChildren(img); } catch { /* Keep the visible CSS fallback. */ }
    }
  } catch { /* Home remains usable without artwork or the registry. */ }
})();
