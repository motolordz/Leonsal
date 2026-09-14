'use strict';

// Shared no-pressure lifecycle for the five flagship previews.
class LeonSalGameShell {
  static sensoryKeys = ['motion', 'sound', 'voice', 'music', 'vibration', 'calmMode', 'particles', 'speed', 'effectsLevel', 'voiceLevel', 'musicLevel', 'contrast', 'pace'];

  static routeGameId() {
    return location.pathname.split('/').pop().replace(/^v2-/, '').replace(/\.html$/, '') || 'v2-game';
  }

  constructor({ settings, motions = [], audio = [], resources = [], reset, gameId = document.body.dataset.gameId || LeonSalGameShell.routeGameId() }) {
    LeonSalGameShell.registerOffline();
    LeonSalGameShell.installConnectionStatus();
    this.settings = settings;
    this.motions = motions;
    this.audio = audio;
    this.resources = new Set(resources);
    this.reset = reset;
    this.gameId = gameId;
    this.localProfiles = typeof LeonSalV2 !== 'undefined' ? new LeonSalV2.LocalProfileEngine() : null;
    this.profile = typeof LeonSalV2 !== 'undefined' ? new LeonSalV2.ProfileProgressStoreEngine(this.localProfiles?.progressKey()) : null;
    this.paused = false;
    this.scene = document.querySelector('.game-scene');
    this.settingsPanel = document.querySelector('#settings');
    this.settingsToggle = document.querySelector('#settingsToggle');
    this.controller = new AbortController();
    window.__leonSalActiveGameShell?.destroy?.();
    window.__leonSalActiveGameShell = this;
    const options = { signal: this.controller.signal };
    const bar = document.createElement('nav');
    this.controls = bar;
    bar.className = 'session-controls';
    bar.setAttribute('aria-label', 'Game controls');
    bar.innerHTML = '<a href="v2-home.html">Home</a><button type="button" data-session-pause>Pause</button><button type="button" data-session-finish>Finished</button>';
    document.querySelector('.game-shell').append(bar);
    this.pauseButton = bar.querySelector('[data-session-pause]');
    this.pauseButton.addEventListener('click', () => this.pause(), options);
    bar.querySelector('[data-session-finish]').addEventListener('click', () => this.pause(true), options);
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'session-dialog';
    this.dialog.setAttribute('aria-labelledby', 'sessionHeading');
    this.dialog.innerHTML = '<h2 id="sessionHeading">Take your time</h2><p>Stay here as long as you like.</p><div class="session-actions"><button type="button" data-resume>Keep playing</button><button type="button" data-repeat>Start again</button><a href="v2-home.html">Choose another game</a></div>';
    document.body.append(this.dialog);
    this.dialog.querySelector('[data-resume]').addEventListener('click', () => this.resume(), options);
    this.dialog.querySelector('[data-repeat]').addEventListener('click', () => { this.reset(); this.resume(); }, options);
    this.dialog.addEventListener('cancel', (event) => { event.preventDefault(); this.resume(); }, options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); }, options);
    window.addEventListener('pagehide', () => this.pause(), options);
    document.body.dataset.paused = 'false';
    this.settingsPanel?.setAttribute('role', 'group');
    this.settingsPanel?.setAttribute('aria-label', 'Sensory settings');
    this.settingsToggle?.setAttribute('aria-controls', 'settings');
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.settingsPanel?.dataset.open === 'true') this.closeSettings(true);
    }, options);
    document.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('#settings, #settingsToggle')) this.closeSettings();
    }, options);
    this.unsubscribe = settings.on('settings-change', () => this.applySettings());
    this.applySettings();
    this.profile?.record(this.gameId, { visits: ((this.profile.value.progress[this.gameId]?.visits || 0) + 1) });
  }
  own(resource) {
    if (resource) this.resources.add(resource);
    return resource;
  }
  release(resource) {
    if (!resource || !this.resources.delete(resource)) return;
    resource.destroy?.();
    resource.dispose?.();
    resource.stop?.();
  }

  static registerOffline() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext || LeonSalGameShell.offlineRegistered) return;
    LeonSalGameShell.offlineRegistered = true;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
    }, { once: true });
  }
  static installConnectionStatus() {
    if (LeonSalGameShell.connectionStatus || typeof navigator === 'undefined') return;
    const status = document.createElement('div');
    LeonSalGameShell.connectionStatus = status;
    status.className = 'connection-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const update = () => {
      status.dataset.online = navigator.onLine ? 'true' : 'false';
      status.textContent = navigator.onLine ? 'Back online.' : 'Offline mode. Saved activities can still open.';
      status.dataset.visible = 'true';
      window.clearTimeout(status.hideTimer);
      status.hideTimer = window.setTimeout(() => {
        if (navigator.onLine) status.dataset.visible = 'false';
      }, 3200);
    };
    status.dataset.online = navigator.onLine ? 'true' : 'false';
    status.dataset.visible = navigator.onLine ? 'false' : 'true';
    status.textContent = navigator.onLine ? 'Ready for online play.' : 'Offline mode. Saved activities can still open.';
    document.body.append(status);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  }
  closeSettings(focus = false) {
    if (!this.settingsPanel) return;
    this.settingsPanel.dataset.open = 'false';
    this.settingsToggle?.setAttribute('aria-expanded', 'false');
    if (focus) this.settingsToggle?.focus();
  }
  applySettings() {
    document.body.dataset.motion = this.settings.allowsMotion() ? 'on' : 'off';
    document.body.dataset.calm = String(this.settings.value.calmMode);
    document.body.dataset.contrast = this.settings.value.contrast;
    document.body.dataset.speed = this.settings.value.speed;
  }
  pause(finished = false) {
    if (!this.paused) this.previousFocus = document.activeElement;
    this.paused = true;
    this.motions.forEach((motion) => motion.pause());
    this.audio.forEach((audio) => audio.stop());
    document.dispatchEvent(new Event('leonsal-pause'));
    this.scene.inert = true;
    document.body.dataset.paused = 'true';
    this.dialog.querySelector('h2').textContent = finished ? 'All done for now' : 'Take your time';
    this.dialog.querySelector('p').textContent = finished ? 'You can play again or choose something else.' : 'Stay here as long as you like.';
    if (finished) this.profile?.markFinished(this.gameId);
    this.closeSettings();
    if (!this.dialog.open) this.dialog.showModal();
  }
  resume() {
    this.dialog.close();
    this.scene.inert = false;
    this.paused = false;
    document.body.dataset.paused = 'false';
    this.motions.forEach((motion) => motion.resume());
    const target = this.previousFocus?.isConnected ? this.previousFocus : this.pauseButton;
    target.focus();
  }
  destroy() {
    this.controller.abort();
    this.unsubscribe?.();
    this.motions.forEach((motion) => motion.stop());
    this.audio.forEach((audio) => audio.stop());
    for (const resource of this.resources) this.release(resource);
    this.scene.inert = false;
    document.body.dataset.paused = 'false';
    this.controls.remove();
    if (this.dialog.open) this.dialog.close();
    this.dialog.remove();
    document.dispatchEvent(new Event('leonsal-destroy'));
    if (window.__leonSalActiveGameShell === this) window.__leonSalActiveGameShell = null;
  }
}
