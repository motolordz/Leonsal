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
