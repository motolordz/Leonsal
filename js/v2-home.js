'use strict';

(() => {
  const host = document.getElementById('hubSettings');
  const toggle = document.getElementById('hubSettingsButton');
  if (!host || !toggle || typeof LeonSalV2 === 'undefined') return;
  const settings = new LeonSalV2.SensorySettings();
  new LeonSalV2.SettingsPanel(host, settings, { keys: ['motion', 'sound', 'voice', 'music', 'vibration', 'calmMode', 'particles', 'speed', 'contrast', 'pace'] });

  const apply = () => {
    document.body.dataset.motion = settings.allowsMotion() ? 'on' : 'off';
    document.body.dataset.calm = String(settings.value.calmMode);
    document.body.dataset.contrast = settings.value.contrast;
    document.body.dataset.speed = settings.value.speed;
  };
  apply();
  settings.on('settings-change', apply);

  const progressHost = document.getElementById('progressSummary');
  const clearProgress = document.getElementById('clearProgress');
  const profile = new LeonSalV2.ProfileProgressStoreEngine();
  const gameNames = {
    'energy-battery': 'My Energy Battery',
    'dash-dock': 'Dash to Charging Dock',
    'bubble-garden': 'Quiet Bubble Garden',
    'light-trail': 'Finger Light Trail',
    'hold-to-breathe': 'Hold to Breathe',
    'trace-engine': 'Trace Path',
    'orbit-engine': 'Orbit Play',
    'cause-effect-engine': 'Cause & Effect'
  };

  const renderProgress = () => {
    if (!progressHost) return;
    const entries = Object.entries(profile.value.progress || {})
      .filter(([, value]) => Number(value.visits || 0) > 0)
      .sort((a, b) => String(b[1].updatedAt || '').localeCompare(String(a[1].updatedAt || '')))
      .slice(0, 4);
    if (!entries.length) {
      progressHost.innerHTML = '<p>No local activity notes yet.</p>';
      return;
    }
    progressHost.innerHTML = entries.map(([id, value]) => {
      const finished = profile.value.finished.includes(id);
      const visits = Number(value.visits || 0);
      return `<article><strong>${gameNames[id] || id}</strong><span>${visits} visit${visits === 1 ? '' : 's'}${finished ? ' · finished once' : ''}</span></article>`;
    }).join('');
  };
  renderProgress();
  profile.on('save', renderProgress);
  clearProgress?.addEventListener('click', () => {
    profile.clear();
    renderProgress();
    clearProgress.textContent = 'Local notes cleared';
    window.setTimeout(() => { clearProgress.textContent = 'Clear local notes'; }, 1300);
  });

  toggle.addEventListener('click', () => {
    const open = host.dataset.open !== 'true';
    host.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('#hubSettings, #hubSettingsButton')) {
      host.dataset.open = 'false';
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && host.dataset.open === 'true') {
      host.dataset.open = 'false';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
})();
