'use strict';

(() => {
  const host = document.getElementById('hubSettings');
  const toggle = document.getElementById('hubSettingsButton');
  if (!host || !toggle || typeof LeonSalV2 === 'undefined') return;
  const settings = new LeonSalV2.SensorySettings();
  const sensoryKeys = ['motion', 'sound', 'voice', 'music', 'vibration', 'calmMode', 'particles', 'speed', 'effectsLevel', 'voiceLevel', 'musicLevel', 'contrast', 'pace'];
  new LeonSalV2.SettingsPanel(host, settings, { keys: sensoryKeys });

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
  const exportProgress = document.getElementById('exportProgress');
  const profileExportNote = document.getElementById('profileExportNote');
  const localProfiles = new LeonSalV2.LocalProfileEngine();
  let profile = new LeonSalV2.ProfileProgressStoreEngine(localProfiles.progressKey());
  const profileSelect = document.getElementById('localProfile');
  const newProfileName = document.getElementById('newProfileName');
  const addProfile = document.getElementById('addProfile');
  const removeProfile = document.getElementById('removeProfile');
  const gameNames = {
    'energy-battery': 'My Energy Battery',
    'dash-dock': 'Dash to Charging Dock',
    'bubble-garden': 'Quiet Bubble Garden',
    'light-trail': 'Finger Light Trail',
    'hold-to-breathe': 'Hold to Breathe',
    'character-world': 'Character World',
    'calm-rain-window': 'Calm Rain Window',
    'firefly-catch': 'Firefly Catch',
    'snow-globe': 'Snow Globe',
    'star-shower': 'Star Shower',
    'growing-garden': 'Growing Garden',
    'number-merge': 'Number Merge',
    'number-merge-v2': 'Number Merge',
    'alphabet-adventure': 'Alphabet Adventure',
    'alphabet-adventure-v2': 'Alphabet Adventure',
    'shape-builder': 'Shape Builder',
    'shape-builder-v2': 'Shape Builder',
    'letter-tracing': 'Letter Tracing',
    'letter-tracing-v2': 'Letter Tracing',
    'number-tracing': 'Number Tracing',
    'number-tracing-v2': 'Number Tracing',
    'shape-tracing': 'Shape Tracing',
    'shape-tracing-v2': 'Shape Tracing',
    'colour-match': 'Colour Match',
    'colour-match-v2': 'Colour Match',
    'big-small': 'Big & Small',
    'big-small-v2': 'Big & Small',
    'pattern-builder': 'Pattern Builder',
    'pattern-builder-v2': 'Pattern Builder',
    'sort-it': 'Sort It',
    'sort-it-v2': 'Sort It',
    'planet-pals': 'Planet Pals',
    'planet-pals-v2': 'Planet Pals',
    'build-solar-system': 'Build the Solar System',
    'build-solar-system-v2': 'Build the Solar System',
    'day-night': 'Day & Night',
    'day-night-v2': 'Day & Night',
    'days-week': 'Days of the Week',
    'days-week-v2': 'Days of the Week',
    'months-year': 'Months of the Year',
    'months-year-v2': 'Months of the Year',
    'seasons': 'Seasons',
    'seasons-v2': 'Seasons',
    'first-clock': 'My First Clock',
    'first-clock-v2': 'My First Clock',
    'weather-world': 'Weather World',
    'weather-world-v2': 'Weather World',
    'animal-habitats': 'Animal Habitats',
    'animal-habitats-v2': 'Animal Habitats',
    'transport-adventure': 'Transport Adventure',
    'transport-adventure-v2': 'Transport Adventure',
    'double-decker-bus': 'Double-Decker Bus Journey',
    'double-decker-bus-v2': 'Double-Decker Bus Journey',
    'trace-engine': 'Trace Path',
    'trace-engine-v2': 'Trace Path',
    'orbit-engine': 'Orbit Play',
    'orbit-engine-v2': 'Orbit Play',
    'cause-effect-engine': 'Cause & Effect',
    'cause-effect-engine-v2': 'Cause & Effect'
  };
  const mixer = new LeonSalV2.SensoryMixerEngine(settings);
  const mixerPresets = document.getElementById('mixerPresets');
  const mixerSummary = document.getElementById('mixerSummary');
  const filterButtons = [...document.querySelectorAll('[data-world-filter]')];
  const gameCards = [...document.querySelectorAll('.world-game[data-world-category]')];

  const applyWorldFilter = (filter) => {
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.worldFilter === filter)));
    gameCards.forEach((card) => {
      const categories = String(card.dataset.worldCategory || '').split(/\s+/);
      const visible = filter === 'all' || categories.includes(filter);
      card.hidden = !visible;
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => applyWorldFilter(button.dataset.worldFilter));
  });

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
  const progressSnapshot = () => {
    const active = localProfiles.activeProfile();
    const entries = Object.entries(profile.value.progress || {})
      .filter(([, value]) => Number(value.visits || 0) > 0)
      .sort((a, b) => String(b[1].updatedAt || '').localeCompare(String(a[1].updatedAt || '')))
      .map(([id, value]) => ({
        activity: gameNames[id] || id,
        visits: Number(value.visits || 0),
        finished: profile.value.finished.includes(id),
        updatedAt: value.updatedAt || null
      }));
    return {
      product: 'LeonSal V2 local activity notes',
      privacy: 'local-device-only',
      profile: { id: active.id, name: active.name },
      generatedAt: new Date().toISOString(),
      summaryType: 'visits-and-finished-sessions',
      notIncluded: ['scores', 'grades', 'mastery claims', 'medical labels', 'sensory subtype labels'],
      activities: entries
    };
  };
  const bindProfileStore = () => {
    profile = new LeonSalV2.ProfileProgressStoreEngine(localProfiles.progressKey());
    profile.on('save', renderProgress);
    renderProgress();
  };
  const renderProfiles = () => {
    if (!profileSelect) return;
    profileSelect.replaceChildren(...localProfiles.value.profiles.map((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      return option;
    }));
    profileSelect.value = localProfiles.value.activeId;
    removeProfile.disabled = localProfiles.value.activeId === 'default';
  };
  renderProfiles();
  renderProgress();
  profile.on('save', renderProgress);
  profileSelect?.addEventListener('change', () => {
    localProfiles.setActive(profileSelect.value);
    bindProfileStore();
    renderProfiles();
  });
  addProfile?.addEventListener('click', () => {
    if (!newProfileName.value.trim()) return;
    localProfiles.add(newProfileName.value);
    newProfileName.value = '';
    bindProfileStore();
    renderProfiles();
  });
  removeProfile?.addEventListener('click', () => {
    localProfiles.remove(localProfiles.value.activeId);
    bindProfileStore();
    renderProfiles();
  });
  clearProgress?.addEventListener('click', () => {
    profile.clear();
    renderProgress();
    clearProgress.textContent = 'Local notes cleared';
    window.setTimeout(() => { clearProgress.textContent = 'Clear local notes'; }, 1300);
  });
  exportProgress?.addEventListener('click', () => {
    const snapshot = progressSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leonsal-local-notes-${snapshot.profile.id}.json`;
    link.textContent = 'Download local summary';
    link.className = 'hub-secondary profile-download-link';
    const existing = document.querySelector('.profile-download-link');
    existing?.remove();
    profileExportNote.replaceChildren(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  });

  const renderMixer = () => {
    if (!mixerSummary) return;
    if (!mixer.savedWorlds.length) {
      mixerSummary.innerHTML = '<p>No saved sensory worlds yet.</p>';
      return;
    }
    mixerSummary.innerHTML = mixer.savedWorlds.slice(0, 3).map((world) => {
      const effective = world.effective || {};
      return `<article><strong>${world.name}</strong><span>Motion ${effective.motion ? 'on' : 'off'} · Sound ${effective.sound ? 'on' : 'off'} · Particles ${effective.particles || 'off'} · Speed ${effective.speed || 'slow'}</span></article>`;
    }).join('');
  };
  if (mixerPresets) {
    mixerPresets.replaceChildren(...mixer.presets.map((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `mixer-card ${preset.visualTheme}`;
      button.textContent = preset.name;
      button.addEventListener('click', () => {
        mixer.applyPreset(preset.id);
        renderMixer();
      });
      return button;
    }));
  }
  renderMixer();
  mixer.on('save', renderMixer);

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
