'use strict';

// Shared no-pressure lifecycle for the five flagship previews.
class LeonSalGameShell {
  constructor({ settings, motions = [], audio = [], reset }) {
    this.settings = settings;
    this.motions = motions;
    this.audio = audio;
    this.reset = reset;
    this.paused = false;
    this.scene = document.querySelector('.game-scene');
    this.settingsPanel = document.querySelector('#settings');
    this.settingsToggle = document.querySelector('#settingsToggle');
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };
    const bar = document.createElement('nav');
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
    this.dialog.remove();
  }
}
