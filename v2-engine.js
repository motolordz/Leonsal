'use strict';

const LeonSalV2 = (() => {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stateForEnergy = (energy) => {
    const value = clamp(Number(energy) || 0, 0, 100);
    if (value < 20) return 'empty';
    if (value < 40) return 'low';
    if (value < 65) return 'calm';
    if (value < 90) return 'happy';
    return 'excited';
  };
  const stateLabels = {
    empty: 'Empty / Sleepy',
    low: 'Low Energy',
    calm: 'Calm / Ready',
    happy: 'Happy / Active',
    excited: 'Full / Excited'
  };
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + ((b - a) * t);

  class EventBus extends EventTarget {
    emit(type, detail = {}) { this.dispatchEvent(new CustomEvent(type, { detail })); }
    on(type, handler) {
      this.addEventListener(type, handler);
      return () => this.removeEventListener(type, handler);
    }
  }

  class SensorySettings extends EventBus {
    constructor(key = 'leonsal-v2-settings') {
      super();
      this.key = key;
      this.value = {
        motion: !prefersReducedMotion.matches,
        sound: false,
        voice: false,
        music: false,
        vibration: false,
        calmMode: false,
        particles: 'gentle',
        speed: 'medium',
        effectsLevel: 'soft',
        voiceLevel: 'soft',
        musicLevel: 'soft',
        contrast: 'standard',
        pace: 'self-paced',
        confetti: false,
        reducedMotion: prefersReducedMotion.matches
      };
      this.load();
      prefersReducedMotion.addEventListener?.('change', () => {
        this.set({ reducedMotion: prefersReducedMotion.matches });
      });
    }
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(this.key) || '{}');
        this.applyValidated(saved);
      } catch (_error) {
        /* Preferences are optional. */
      }
    }
    save() {
      try { localStorage.setItem(this.key, JSON.stringify(this.value)); } catch (_error) { /* optional */ }
    }
    applyValidated(patch) {
      if (!patch || typeof patch !== 'object') return;
      for (const key of ['motion', 'sound', 'voice', 'music', 'vibration', 'calmMode', 'confetti', 'reducedMotion']) {
        if (typeof patch[key] === 'boolean') this.value[key] = patch[key];
      }
      if (['off', 'low', 'gentle'].includes(patch.particles)) this.value.particles = patch.particles;
      const speedAliases = { normal: 'medium', lively: 'fast' };
      const requestedSpeed = speedAliases[patch.speed] || patch.speed;
      if (['super-slow', 'slow', 'medium', 'fast', 'super-speed'].includes(requestedSpeed)) this.value.speed = requestedSpeed;
      if (['off', 'soft', 'medium'].includes(patch.effectsLevel)) this.value.effectsLevel = patch.effectsLevel;
      if (['off', 'soft', 'medium'].includes(patch.voiceLevel)) this.value.voiceLevel = patch.voiceLevel;
      if (['off', 'soft', 'medium'].includes(patch.musicLevel)) this.value.musicLevel = patch.musicLevel;
      if (['standard', 'strong'].includes(patch.contrast)) this.value.contrast = patch.contrast;
      if (['self-paced', 'guided'].includes(patch.pace)) this.value.pace = patch.pace;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.value.reducedMotion = true;
    }
    set(patch) {
      this.applyValidated(patch);
      this.save();
      this.emit('settings-change', this.value);
    }
    allowsMotion() { return this.value.motion && !this.value.reducedMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    speedFactor() {
      if (!this.allowsMotion()) return 0;
      if (this.value.calmMode) return 0.55;
      return { 'super-slow': 0.35, slow: 0.65, medium: 1, fast: 1.18, 'super-speed': 1.4 }[this.value.speed] || 1;
    }
    particleCount(base) {
      if (this.value.calmMode || this.value.particles === 'off') return 0;
      if (this.value.particles === 'low') return Math.ceil(base * 0.4);
      return base;
    }
    levelValue(key) {
      const value = this.value[key];
      if (value === 'off') return 0;
      if (value === 'medium') return 0.68;
      return 0.36;
    }
  }

  class SettingsPanel {
    constructor(host, settings, options = {}) {
      this.host = host;
      this.settings = settings;
      this.keys = options.keys || ['motion', 'sound', 'vibration', 'calmMode'];
      this.labels = {
        motion: 'Motion',
        sound: 'Sound',
        voice: 'Voice',
        music: 'Music',
        vibration: 'Vibration',
        calmMode: 'Calm Mode',
        particles: 'Particles',
        speed: 'Speed',
        effectsLevel: 'Effects',
        voiceLevel: 'Voice Level',
        musicLevel: 'Music Level',
        contrast: 'Contrast',
        pace: 'Pace',
        confetti: 'Confetti'
      };
      this.choices = {
        particles: ['gentle', 'low', 'off'],
        speed: ['super-slow', 'slow', 'medium', 'fast', 'super-speed'],
        effectsLevel: ['soft', 'medium', 'off'],
        voiceLevel: ['soft', 'medium', 'off'],
        musicLevel: ['soft', 'medium', 'off'],
        contrast: ['standard', 'strong'],
        pace: ['self-paced', 'guided']
      };
      this.render();
      this.unsubscribe = settings.on('settings-change', () => this.update());
    }
    update() {
      this.host.querySelectorAll('[data-key]').forEach((button) => {
        const key = button.dataset.key;
        const value = this.settings.value[key];
        const isChoice = this.choices[key];
        button.setAttribute('aria-pressed', String(isChoice ? value !== this.choices[key][0] : Boolean(value)));
        button.querySelector('em')?.replaceChildren(document.createTextNode(this.valueLabel(key, value)));
      });
    }
    destroy() { this.unsubscribe?.(); this.host.replaceChildren(); }
    valueLabel(key, value) {
      if (typeof value === 'boolean') return value ? 'On' : 'Off';
      return String(value).split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(' ');
    }
    render() {
      this.host.innerHTML = this.keys.map((key) => {
        const value = this.settings.value[key];
        const pressed = this.choices[key] ? value !== this.choices[key][0] : Boolean(value);
        return `<button class="v2-setting-pill" type="button" data-key="${key}" aria-pressed="${pressed}"><span></span>${this.labels[key] || key}<em>${this.valueLabel(key, value)}</em></button>`;
      }).join('');
      this.host.querySelectorAll('[data-key]').forEach((button) => {
        button.addEventListener('click', () => {
          const key = button.dataset.key;
          if (this.choices[key]) {
            const choices = this.choices[key];
            const index = choices.indexOf(this.settings.value[key]);
            this.settings.set({ [key]: choices[(index + 1) % choices.length] });
          } else {
            this.settings.set({ [key]: !this.settings.value[key] });
          }
          this.update();
        });
      });
    }
  }

  class MotionEngine extends EventBus {
    constructor(settings) {
      super();
      this.settings = settings;
      this.items = new Set();
      this.frame = 0;
      this.last = 0;
      this.paused = false;
    }
    add(step) {
      this.items.add(step);
      this.start();
      return () => this.items.delete(step);
    }
    start() {
      if (this.frame || this.paused) return;
      this.last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        for (const step of this.items) step(dt, now);
        this.frame = !this.paused && this.items.size ? requestAnimationFrame(tick) : 0;
      };
      this.frame = requestAnimationFrame(tick);
    }
    pause() {
      this.paused = true;
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    resume() { this.paused = false; if (this.items.size) this.start(); }
    stop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.items.clear();
    }
    tween({ from = 0, to = 1, duration = 600, onUpdate, onComplete }) {
      if (!this.settings.allowsMotion() || duration <= 0) {
        onUpdate?.(to);
        onComplete?.();
        return () => {};
      }
      let elapsed = 0;
      const remove = this.add((dt) => {
        elapsed += dt * 1000;
        const t = this.settings.allowsMotion() ? clamp(elapsed / duration, 0, 1) : 1;
        onUpdate?.(lerp(from, to, easeOutCubic(t)));
        if (t >= 1) {
          remove();
          onComplete?.();
        }
      });
      return remove;
    }
    spring(current, target, velocity, stiffness = 260, damping = 28, dt = 1 / 60) {
      const force = (target - current) * stiffness;
      const nextVelocity = (velocity + force * dt) * Math.exp(-damping * dt);
      return { value: current + nextVelocity * dt, velocity: nextVelocity };
    }
  }

  class StateMachine extends EventBus {
    constructor(initial, transitions) {
      super();
      this.state = initial;
      this.transitions = transitions;
    }
    send(event, data = {}) {
      const transition = this.transitions[this.state]?.[event];
      if (!transition) return false;
      this.state = typeof transition === 'function' ? transition(data) : transition;
      this.emit('state-change', { state: this.state, event, data });
      return true;
    }
  }

  class AudioEngine {
    constructor(settings) {
      this.settings = settings;
      this.ctx = null;
      this.nodes = new Set();
      this.unsubscribe = settings.on('settings-change', () => { if (!settings.value.sound) this.stop(); });
    }
    ensure() {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx ||= new Ctx();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }
    tone(type = 'tap') {
      if (!this.settings.value.sound || this.settings.value.effectsLevel === 'off') return;
      const ctx = this.ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.frequency.value = type === 'success' ? 520 : 360;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045 * this.settings.levelValue('effectsLevel'), now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      this.nodes.add(osc);
      osc.onended = () => this.nodes.delete(osc);
    }
    stop() {
      for (const node of this.nodes) {
        try { node.stop(); } catch (_error) { /* already stopped */ }
      }
      this.nodes.clear();
    }
  }

  class InputEngine {
    constructor(host) {
      this.host = host;
      this.cleanups = [];
    }
    onPointer({ down, move, up, holdMs = 520, hold }) {
      let active = null;
      let holdTimer = 0;
      const point = (event) => ({ x: event.clientX, y: event.clientY, id: event.pointerId, event });
      const clearHold = () => {
        window.clearTimeout(holdTimer);
        holdTimer = 0;
      };
      const onDown = (event) => {
        if (active !== null || event.button > 0 || event.target.closest?.('button, a, input, select, textarea')) return;
        active = event.pointerId;
        this.host.setPointerCapture?.(active);
        down?.(point(event));
        clearHold();
        if (hold) holdTimer = window.setTimeout(() => hold(point(event)), holdMs);
      };
      const onMove = (event) => {
        if (active !== event.pointerId) return;
        move?.(point(event));
      };
      const onUp = (event) => {
        if (active !== event.pointerId) return;
        clearHold();
        up?.(point(event));
        active = null;
      };
      this.host.addEventListener('pointerdown', onDown);
      this.host.addEventListener('pointermove', onMove);
      this.host.addEventListener('pointerup', onUp);
      this.host.addEventListener('pointercancel', onUp);
      this.host.addEventListener('lostpointercapture', onUp);
      this.cleanups.push(() => {
        clearHold();
        this.host.removeEventListener('pointerdown', onDown);
        this.host.removeEventListener('pointermove', onMove);
        this.host.removeEventListener('pointerup', onUp);
        this.host.removeEventListener('pointercancel', onUp);
        this.host.removeEventListener('lostpointercapture', onUp);
      });
    }
    destroy() {
      this.cleanups.splice(0).forEach((cleanup) => cleanup());
    }
  }

  class GaugeBattery {
    constructor(svg) {
      this.svg = svg;
      this.fill = svg.querySelector('[data-fill]');
      this.face = svg.querySelector('[data-face]');
      this.label = svg.querySelector('[data-label]');
      this.eyes = Array.from(svg.querySelectorAll('[data-eye]'));
      this.body = { x: 52, y: 88, width: 294, height: 114 };
      this.set(0);
    }
    faceGeometry(state) {
      const body = this.body;
      const cx = body.x + body.width / 2;
      const eyeY = body.y + body.height * (state === 'empty' ? 0.39 : 0.37);
      const eyeGap = body.width * 0.13;
      const eyeRadius = body.height * 0.105;
      const mouthY = body.y + body.height * 0.66;
      const halfMouth = body.width * ({ empty: 0.055, excited: 0.106 }[state] || 0.092);
      const mouthLift = {
        empty: 2,
        low: -7,
        calm: 8,
        happy: 18,
        excited: 24
      }[state];
      return {
        cx,
        leftEye: { cx: cx - eyeGap, cy: eyeY, r: eyeRadius },
        rightEye: { cx: cx + eyeGap, cy: eyeY, r: eyeRadius },
        mouth: {
          d: `M${cx - halfMouth} ${mouthY} Q${cx} ${mouthY + mouthLift} ${cx + halfMouth} ${mouthY}`
        }
      };
    }
    set(energy) {
      const value = clamp(Number(energy) || 0, 0, 100);
      const state = stateForEnergy(value);
      this.fill?.setAttribute('width', String(3.12 * value));
      this.fill?.setAttribute('fill', { empty: '#ef6f66', low: '#f29b48', calm: '#f3d24f', happy: '#45c56b', excited: '#1fc9f5' }[state]);
      const geometry = this.faceGeometry(state);
      if (this.eyes.length >= 2) {
        this.eyes[0].setAttribute('cx', String(geometry.leftEye.cx));
        this.eyes[0].setAttribute('cy', String(geometry.leftEye.cy));
        this.eyes[0].setAttribute('r', String(geometry.leftEye.r));
        this.eyes[1].setAttribute('cx', String(geometry.rightEye.cx));
        this.eyes[1].setAttribute('cy', String(geometry.rightEye.cy));
        this.eyes[1].setAttribute('r', String(geometry.rightEye.r));
      }
      if (this.face) {
        this.face.setAttribute('d', geometry.mouth.d);
      }
      if (this.label) this.label.textContent = `${Math.round(value)}%`;
      this.svg.dataset.energyState = state;
      return { value, state, label: stateLabels[state], geometry };
    }
  }

  class ParticleEngine {
    constructor(canvas, motion, settings) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.motion = motion;
      this.settings = settings;
      this.items = [];
      this.remove = null;
    }
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const scale = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.max(1, Math.round(rect.width * scale));
      this.canvas.height = Math.max(1, Math.round(rect.height * scale));
      this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }
    seed(type = 'bubbles', count = 24) {
      this.resize();
      const rect = this.canvas.getBoundingClientRect();
      const visibleCount = type === 'bubbles' && (this.settings.value.calmMode || this.settings.value.particles === 'off') ? Math.min(6, count) : this.settings.particleCount(count);
      this.items = Array.from({ length: visibleCount }, () => ({
        type,
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        r: 14 + Math.random() * 34,
        vx: -10 + Math.random() * 20,
        vy: -10 - Math.random() * 24,
        life: 0.52 + Math.random() * 0.38,
        wobble: Math.random() * Math.PI * 2,
        depth: 0.62 + Math.random() * 0.5,
        hue: 190 + Math.random() * 80
      }));
    }
    start(type = 'bubbles') {
      if (!this.items.length) this.seed(type);
      this.remove?.();
      this.remove = this.motion.add((dt) => this.step(dt));
    }
    step(dt) {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.items = this.items.filter((item) => item.life > 0);
      for (const item of this.items) {
        if (this.settings.allowsMotion()) {
          item.wobble = (item.wobble || 0) + dt * 1.8;
          item.x += (item.vx + Math.sin(item.wobble) * 9) * dt;
          item.y += item.vy * dt;
        }
        item.age = (item.age || 0) + dt;
        if (item.type === 'sparkle') item.life = Math.max(0, 0.7 - item.age);
        if (item.y < -item.r) item.y = rect.height + item.r;
        if (item.life <= 0) continue;
        this.ctx.globalAlpha = item.life;
        this.ctx.beginPath();
        this.ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        if (item.type === 'stars' || item.type === 'sparkle') {
          this.ctx.fillStyle = '#ffd94e';
        } else {
          const gradient = this.ctx.createRadialGradient(item.x - item.r * .35, item.y - item.r * .35, item.r * .08, item.x, item.y, item.r);
          gradient.addColorStop(0, 'rgba(255,255,255,.95)');
          gradient.addColorStop(.24, `hsla(${item.hue} 95% 78% / .62)`);
          gradient.addColorStop(1, `hsla(${item.hue + 34} 92% 58% / .18)`);
          this.ctx.fillStyle = gradient;
        }
        this.ctx.fill();
        this.ctx.strokeStyle = item.type === 'sparkle' ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.86)';
        this.ctx.lineWidth = item.type === 'sparkle' ? 1.5 : 2.5;
        this.ctx.stroke();
        if (item.type !== 'sparkle') {
          this.ctx.globalAlpha = item.life * .8;
          this.ctx.beginPath();
          this.ctx.arc(item.x - item.r * .28, item.y - item.r * .3, Math.max(3, item.r * .18), 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(255,255,255,.9)';
          this.ctx.fill();
        }
      }
      this.ctx.globalAlpha = 1;
    }
    popAt(x, y) {
      const index = this.items.findIndex((item) => item.type !== 'sparkle' && Math.hypot(item.x - x, item.y - y) <= item.r + 12);
      if (index < 0) return false;
      const hit = this.items[index];
      this.items.splice(index, 1);
      const burstCount = this.settings.allowsMotion() ? this.settings.particleCount(6) : 0;
      for (let i = 0; i < burstCount; i += 1) {
        const angle = (Math.PI * 2 * i) / burstCount;
        this.items.push({
          type: 'sparkle',
          x: hit.x,
          y: hit.y,
          r: 3 + Math.random() * 5,
          vx: Math.cos(angle) * (34 + Math.random() * 28),
          vy: Math.sin(angle) * (34 + Math.random() * 28),
          life: 0.7,
          age: 0,
          hue: hit.hue
        });
      }
      return Boolean(hit);
    }
    destroy() {
      this.remove?.();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  class TrailEngine {
    constructor(canvas, motion, settings) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.motion = motion;
      this.settings = settings;
      this.points = [];
      this.maxPoints = 72;
      this.mode = 'light';
      this.emitters = [];
      this.remove = this.motion.add((dt) => this.tick(dt));
      this.resize();
    }
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const scale = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.max(1, Math.round(rect.width * scale));
      this.canvas.height = Math.max(1, Math.round(rect.height * scale));
      this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }
    addPoint(x, y) {
      const last = this.points[this.points.length - 1];
      if (last) {
        const distance = Math.hypot(x - last.x, y - last.y);
        const steps = Math.max(1, Math.ceil(distance / 8));
        for (let i = 1; i <= steps; i += 1) {
          this.points.push({ x: lerp(last.x, x, i / steps), y: lerp(last.y, y, i / steps), age: 0 });
        }
      } else {
        this.points.push({ x, y, age: 0 });
      }
      const max = this.settings.value.calmMode ? Math.min(this.maxPoints, 36) : this.maxPoints;
      if (this.points.length > max) this.points.splice(0, this.points.length - max);
      if (this.settings.allowsMotion() && this.settings.particleCount(1)) this.emit(x, y);
      this.draw();
    }
    emit(x, y) {
      if (this.mode === 'stars') {
        this.emitters.push({ x, y, age: 0, life: 1.1, size: 3 + Math.random() * 5, hue: 48 });
      } else if (this.mode === 'rainbow' && Math.random() > .45) {
        this.emitters.push({ x, y, age: 0, life: .72, size: 2 + Math.random() * 4, hue: Math.random() * 360 });
      }
      if (this.emitters.length > 80) this.emitters.splice(0, this.emitters.length - 80);
    }
    tick(dt) {
      this.points.forEach((point) => { point.age += dt; });
      this.points = this.points.filter((point) => point.age < 2.4);
      this.emitters.forEach((item) => { item.age += dt; if (this.settings.allowsMotion()) item.y -= dt * 10; });
      this.emitters = this.emitters.filter((item) => item.age < item.life);
      this.draw();
    }
    draw() {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      for (const width of [30, 18, 8]) {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowBlur = width === 8 ? 16 : 30;
        this.ctx.shadowColor = this.mode === 'rainbow' ? 'rgba(120,220,255,.9)' : this.mode === 'stars' ? 'rgba(255,216,77,.9)' : 'rgba(100,214,255,.95)';
        for (let i = 1; i < this.points.length; i += 1) {
          const a = this.points[i - 1];
          const b = this.points[i];
          this.ctx.globalAlpha = clamp(1 - b.age / 2.4, 0, 1) * (width === 8 ? 1 : .22);
          this.ctx.strokeStyle = this.colorFor(i);
          this.ctx.lineWidth = this.settings.value.calmMode ? Math.max(5, width * .45) : width;
          this.ctx.beginPath();
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          this.ctx.moveTo(a.x, a.y);
          this.ctx.quadraticCurveTo(a.x, a.y, midX, midY);
          this.ctx.stroke();
        }
      }
      this.ctx.shadowBlur = 0;
      for (const item of this.emitters) {
        const alpha = clamp(1 - item.age / item.life, 0, 1);
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = this.mode === 'rainbow' ? `hsl(${item.hue} 95% 68%)` : '#fff3a6';
        this.ctx.beginPath();
        if (this.mode === 'stars') {
          for (let p = 0; p < 10; p += 1) {
            const radius = p % 2 ? item.size * .45 : item.size;
            const angle = -Math.PI / 2 + p * Math.PI / 5;
            const px = item.x + Math.cos(angle) * radius;
            const py = item.y + Math.sin(angle) * radius;
            if (p === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
          }
        } else {
          this.ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
        }
        this.ctx.fill();
      }
      this.ctx.globalAlpha = 1;
    }
    colorFor(index) {
      if (this.settings.value.calmMode) return '#4aa8ff';
      if (this.mode === 'rainbow') return `hsl(${(index * 12) % 360} 92% 60%)`;
      if (this.mode === 'stars') return '#ffd84d';
      return '#64d6ff';
    }
    clear() {
      this.points = [];
      this.draw();
    }
    destroy() {
      this.remove?.();
      this.clear();
    }
  }

  class DragDropEngine {
    constructor(options = {}) {
      this.items = new Map();
      this.snapDistance = options.snapDistance || 42;
    }
    register(item, zone, callbacks = {}) {
      this.items.set(item, { zone, callbacks });
      item.addEventListener('click', () => callbacks.select?.(item));
      zone.addEventListener('click', () => callbacks.drop?.(item, zone));
    }
    nearest(point, zones) {
      let best = null;
      for (const zone of zones) {
        const rect = zone.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const distance = Math.hypot(point.x - center.x, point.y - center.y);
        if (!best || distance < best.distance) best = { zone, distance };
      }
      return best && best.distance <= this.snapDistance ? best.zone : null;
    }
  }

  class RewardEngine {
    constructor(settings, particles, audio) {
      this.settings = settings;
      this.particles = particles;
      this.audio = audio;
    }
    success(message = 'Complete') {
      this.audio?.tone?.('success');
      if (this.settings.value.confetti && !this.settings.value.calmMode) this.particles?.seed('stars', 18);
      return message;
    }
    celebrate(target, options = {}) {
      const type = options.type || 'glow';
      this.audio?.tone?.('success');
      if (target && type === 'glow') {
        target.dataset.reward = 'glow';
        const duration = this.settings.allowsMotion() && !this.settings.value.calmMode ? 700 : 120;
        window.clearTimeout(target.rewardTimer);
        target.rewardTimer = window.setTimeout(() => {
          if (target.isConnected) target.dataset.reward = 'idle';
        }, duration);
      }
      if (this.settings.value.confetti && !this.settings.value.calmMode) this.particles?.seed?.('stars', 10);
      return { type, calmMode: this.settings.value.calmMode, reducedMotion: !this.settings.allowsMotion() };
    }
  }

  class TraceEngine extends EventBus {
    constructor(canvas, motion, settings, options = {}) {
      super();
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.motion = motion;
      this.settings = settings;
      this.path = options.path || [];
      this.tolerance = options.tolerance || 34;
      this.progress = 0;
      this.points = [];
      this.resize();
      this.resizeHandler = () => this.resize();
      window.addEventListener('resize', this.resizeHandler);
      this.draw();
    }
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const scale = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.max(1, Math.round(rect.width * scale));
      this.canvas.height = Math.max(1, Math.round(rect.height * scale));
      this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }
    setPath(pathPoints) {
      this.path = pathPoints;
      this.reset();
    }
    reset() {
      this.progress = 0;
      this.points = [];
      this.draw();
    }
    addPoint(x, y) {
      const target = this.path[Math.min(this.progress, this.path.length - 1)];
      if (!target) return { complete: true, near: true, progress: 1 };
      const distance = Math.hypot(x - target.x, y - target.y);
      const near = distance <= this.tolerance;
      this.points.push({ x, y, near, age: 0 });
      if (near) this.progress = Math.min(this.path.length, this.progress + 1);
      this.draw();
      const complete = this.progress >= this.path.length;
      if (complete) this.emit('complete', { progress: 1 });
      return { complete, near, progress: this.path.length ? this.progress / this.path.length : 1 };
    }
    draw() {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      if (this.path.length > 1) {
        this.ctx.strokeStyle = 'rgba(255,255,255,.8)';
        this.ctx.lineWidth = this.tolerance * 2;
        this.ctx.beginPath();
        this.path.forEach((p, i) => i ? this.ctx.lineTo(p.x, p.y) : this.ctx.moveTo(p.x, p.y));
        this.ctx.stroke();
        this.ctx.strokeStyle = '#2f91e8';
        this.ctx.lineWidth = 16;
        this.ctx.stroke();
      }
      if (this.points.length > 1) {
        this.ctx.strokeStyle = '#45bd6b';
        this.ctx.lineWidth = 18;
        this.ctx.shadowBlur = this.settings.value.calmMode ? 0 : 18;
        this.ctx.shadowColor = 'rgba(69,189,107,.52)';
        this.ctx.beginPath();
        this.points.forEach((p, i) => i ? this.ctx.lineTo(p.x, p.y) : this.ctx.moveTo(p.x, p.y));
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }
    }
    destroy() {
      window.removeEventListener('resize', this.resizeHandler);
      this.reset();
    }
  }

  class SortMatchEngine extends EventBus {
    constructor() { super(); this.matches = new Map(); }
    register(itemId, categoryId) { this.matches.set(itemId, categoryId); }
    check(itemId, categoryId) {
      const matched = this.matches.get(itemId) === categoryId;
      this.emit(matched ? 'match' : 'try-again', { itemId, categoryId });
      return matched;
    }
  }

  class SequenceEngine extends EventBus {
    constructor(items = []) { super(); this.items = items; this.index = 0; }
    current() { return this.items[this.index]; }
    next() { this.index = clamp(this.index + 1, 0, Math.max(0, this.items.length - 1)); this.emit('change', { item: this.current(), index: this.index }); return this.current(); }
    previous() { this.index = clamp(this.index - 1, 0, Math.max(0, this.items.length - 1)); this.emit('change', { item: this.current(), index: this.index }); return this.current(); }
    reset() { this.index = 0; this.emit('change', { item: this.current(), index: this.index }); }
  }

  class OrbitEngine extends EventBus {
    constructor(motion, settings) { super(); this.motion = motion; this.settings = settings; this.items = new Set(); this.remove = null; this.speedScale = 1; }
    add(item) {
      const next = { angle: 0, speed: .45, radius: 100, ...item };
      next.baseSpeed = next.baseSpeed || next.speed;
      this.items.add(next);
      this.start();
    }
    start() { if (this.remove) return; this.remove = this.motion.add((dt) => this.step(dt)); }
    step(dt) {
      for (const item of this.items) {
        if (this.settings.allowsMotion()) item.angle += item.speed * dt;
        item.x = item.cx + Math.cos(item.angle) * item.radius;
        item.y = item.cy + Math.sin(item.angle) * item.radius;
        item.update?.(item);
      }
    }
    setSpeed(scale) { this.speedScale = scale; for (const item of this.items) item.speed = item.baseSpeed * scale; }
    destroy() { this.remove?.(); this.remove = null; this.items.clear(); }
  }

  class BuildAssemblyEngine extends EventBus {
    constructor(points = []) { super(); this.points = points; this.placed = new Set(); }
    snap(pieceId, x, y) {
      const point = this.points.find((candidate) => candidate.id === pieceId);
      if (!point) return null;
      const near = Math.hypot(point.x - x, point.y - y) <= (point.tolerance || 36);
      if (near) this.placed.add(pieceId);
      this.emit(near ? 'snap' : 'miss', { pieceId, point });
      return near ? point : null;
    }
    complete() { return this.placed.size >= this.points.length; }
  }

  class RhythmEngine extends EventBus {
    constructor(pattern = []) { super(); this.pattern = pattern; this.index = 0; }
    tap(value) {
      const expected = this.pattern[this.index];
      const matched = expected === value;
      this.index = matched ? (this.index + 1) % this.pattern.length : 0;
      this.emit(matched ? 'beat' : 'reset', { value, expected, index: this.index });
      return matched;
    }
  }

  class BalanceTiltEngine extends EventBus {
    constructor(settings) { super(); this.settings = settings; this.x = 0; this.y = 0; }
    setPointer(point, rect) {
      this.x = clamp(((point.x - rect.left) / rect.width - .5) * 2, -1, 1);
      this.y = clamp(((point.y - rect.top) / rect.height - .5) * 2, -1, 1);
      this.emit('tilt', { x: this.x, y: this.y });
    }
  }

  class CauseEffectEngine extends EventBus {
    constructor() { super(); this.effects = new Map(); }
    connect(cause, effect) { this.effects.set(cause, effect); }
    trigger(cause, data = {}) {
      const effect = this.effects.get(cause);
      const result = effect?.(data);
      this.emit('effect', { cause, result });
      return result;
    }
    destroy() { this.effects.clear(); }
  }

  class TimeCycleEngine extends EventBus {
    constructor(items = []) { super(); this.sequence = new SequenceEngine(items); }
    set(index) { this.sequence.index = clamp(index, 0, Math.max(0, this.sequence.items.length - 1)); this.emit('cycle', { item: this.sequence.current(), index: this.sequence.index }); }
  }

  class CalmWorldEngine {
    constructor(canvas, motion, settings) {
      this.particles = new ParticleEngine(canvas, motion, settings);
    }
    rain(count = 28) { this.particles.seed('bubbles', count); this.particles.start('bubbles'); }
    destroy() { this.particles.destroy(); }
  }

  class MemoryRecallEngine extends EventBus {
    constructor(items = []) {
      super();
      this.items = items.map((item, index) => ({ ...item, index, revealed: false, matched: false }));
      this.open = [];
      this.attempts = 0;
    }
    reveal(index) {
      const item = this.items[index];
      if (!item || item.matched || item.revealed || this.open.length >= 2) return { changed: false };
      item.revealed = true;
      this.open.push(item);
      this.emit('reveal', { item });
      if (this.open.length === 2) return this.check();
      return { changed: true, waiting: true, item };
    }
    check() {
      this.attempts += 1;
      const [a, b] = this.open;
      const matched = Boolean(a && b && a.pairId === b.pairId && a.index !== b.index);
      if (matched) {
        a.matched = true;
        b.matched = true;
        this.open = [];
      }
      const result = { matched, complete: this.complete(), items: [a, b].filter(Boolean) };
      this.emit(matched ? 'match' : 'try-again', result);
      return result;
    }
    hideOpen() {
      for (const item of this.open) item.revealed = false;
      this.open = [];
      this.emit('hide-open');
    }
    complete() { return this.items.length > 0 && this.items.every((item) => item.matched); }
    reset() {
      this.items.forEach((item) => { item.revealed = false; item.matched = false; });
      this.open = [];
      this.attempts = 0;
      this.emit('reset');
    }
  }

  class PhysicsPlayEngine extends EventBus {
    constructor(motion, settings, bounds = { width: 390, height: 600 }) {
      super();
      this.motion = motion;
      this.settings = settings;
      this.bounds = bounds;
      this.items = new Set();
      this.gravity = 420;
      this.remove = null;
    }
    add(item) {
      const next = { x: 0, y: 0, vx: 0, vy: 0, radius: 24, bounce: 0.42, ...item };
      this.items.add(next);
      this.start();
      return next;
    }
    setBounds(bounds) { this.bounds = { ...this.bounds, ...bounds }; }
    start() { if (!this.remove) this.remove = this.motion.add((dt) => this.step(dt)); }
    step(dt) {
      if (!this.settings.allowsMotion()) return;
      const speed = this.settings.value.calmMode ? 0.45 : 1;
      for (const item of this.items) {
        item.vy += this.gravity * dt * speed;
        item.x += item.vx * dt * speed;
        item.y += item.vy * dt * speed;
        const maxX = this.bounds.width - item.radius;
        const maxY = this.bounds.height - item.radius;
        if (item.x < item.radius || item.x > maxX) {
          item.x = clamp(item.x, item.radius, maxX);
          item.vx *= -item.bounce;
        }
        if (item.y < item.radius || item.y > maxY) {
          item.y = clamp(item.y, item.radius, maxY);
          item.vy *= -item.bounce;
        }
      }
      this.emit('step', { items: [...this.items] });
    }
    applyForce(item, force = {}) {
      if (!this.items.has(item)) return false;
      item.vx += force.x || 0;
      item.vy += force.y || 0;
      this.emit('force', { item, force });
      return true;
    }
    reset() {
      this.items.clear();
      this.emit('reset');
    }
    destroy() {
      this.remove?.();
      this.remove = null;
      this.items.clear();
    }
  }

  class CharacterStateAnimationEngine extends EventBus {
    constructor(resolver, settings) {
      super();
      this.resolver = resolver;
      this.settings = settings;
      this.current = null;
    }
    set({ characterId, energy, state, element }) {
      const resolvedState = state || stateForEnergy(energy);
      const asset = this.resolver?.(characterId, resolvedState) || null;
      this.current = { characterId, state: resolvedState, asset };
      if (element) {
        element.dataset.characterId = characterId;
        element.dataset.energyState = resolvedState;
        if (asset?.approved && asset.src) {
          element.hidden = false;
          element.src = asset.src;
        } else {
          element.hidden = true;
          element.removeAttribute('src');
        }
      }
      this.emit('state-change', this.current);
      return this.current;
    }
  }

  class WorldShellProgressEngine extends EventBus {
    constructor(steps = []) {
      super();
      this.steps = steps;
      this.index = 0;
      this.finished = false;
    }
    current() { return this.steps[this.index] || null; }
    next() {
      if (this.finished) return this.current();
      this.index = clamp(this.index + 1, 0, Math.max(0, this.steps.length - 1));
      this.emit('progress', { index: this.index, step: this.current(), complete: this.complete() });
      return this.current();
    }
    complete() { return this.steps.length > 0 && this.index >= this.steps.length - 1; }
    finish() {
      this.finished = true;
      this.emit('finished', { index: this.index, step: this.current() });
    }
    reset() {
      this.index = 0;
      this.finished = false;
      this.emit('reset', { step: this.current() });
    }
  }

  class AssetLoaderEngine extends EventBus {
    constructor(options = {}) {
      super();
      this.forbidden = options.forbidden || /source-safe-keeping|rejected|review-only|pilot-qa|contact-sheet|\/qa\//i;
      this.cache = new Map();
    }
    canResolve(record) {
      return Boolean(record?.status === 'approved' && record.webPath && !this.forbidden.test(record.webPath));
    }
    resolve(record) {
      if (!this.canResolve(record)) {
        this.emit('blocked', { id: record?.id || record?.characterId, status: record?.status });
        return null;
      }
      return record.webPath;
    }
    preload(src) {
      if (!src || this.forbidden.test(src)) return Promise.resolve(null);
      if (this.cache.has(src)) return this.cache.get(src);
      const promise = new Promise((resolve) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
      });
      this.cache.set(src, promise);
      return promise;
    }
    clear() { this.cache.clear(); }
  }

  class PerformanceMonitorEngine extends EventBus {
    constructor(motion) {
      super();
      this.motion = motion;
      this.samples = [];
      this.longTasks = [];
      this.remove = null;
      this.observer = null;
    }
    start() {
      if (!this.remove && this.motion) {
        this.remove = this.motion.add((dt) => {
          if (dt <= 0) return;
          const fps = 1 / dt;
          this.samples.push(fps);
          if (this.samples.length > 180) this.samples.shift();
          this.emit('sample', this.summary());
        });
      }
      if (!this.observer && 'PerformanceObserver' in window) {
        try {
          this.observer = new PerformanceObserver((list) => {
            this.longTasks.push(...list.getEntries().map((entry) => ({ duration: entry.duration, startTime: entry.startTime })));
            if (this.longTasks.length > 30) this.longTasks.splice(0, this.longTasks.length - 30);
          });
          this.observer.observe({ entryTypes: ['longtask'] });
        } catch (_error) {
          this.observer = null;
        }
      }
    }
    summary() {
      const samples = this.samples;
      const avg = samples.length ? samples.reduce((sum, fps) => sum + fps, 0) / samples.length : 0;
      const worst = samples.length ? Math.min(...samples) : 0;
      return { averageFps: avg, worstFps: worst, sampleCount: samples.length, longTaskCount: this.longTasks.length };
    }
    stop() {
      this.remove?.();
      this.remove = null;
      this.observer?.disconnect();
      this.observer = null;
    }
    reset() {
      this.samples = [];
      this.longTasks = [];
      this.emit('reset');
    }
  }

  class ProfileProgressStoreEngine extends EventBus {
    constructor(key = 'leonsal-v2-profile-progress') {
      super();
      this.key = key;
      this.value = { preferences: {}, progress: {}, finished: [] };
      this.load();
    }
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(this.key) || '{}');
        if (saved && typeof saved === 'object') this.value = { ...this.value, ...saved };
      } catch (_error) {
        /* Local progress is optional. */
      }
    }
    save() {
      try { localStorage.setItem(this.key, JSON.stringify(this.value)); } catch (_error) { /* optional */ }
      this.emit('save', this.value);
    }
    setPreference(key, value) {
      this.value.preferences[key] = value;
      this.save();
    }
    record(gameId, data = {}) {
      this.value.progress[gameId] = { ...(this.value.progress[gameId] || {}), ...data, updatedAt: new Date().toISOString() };
      this.save();
    }
    markFinished(gameId) {
      if (!this.value.finished.includes(gameId)) this.value.finished.push(gameId);
      this.save();
    }
    clear() {
      this.value = { preferences: {}, progress: {}, finished: [] };
      this.save();
    }
  }

  class LocalProfileEngine extends EventBus {
    constructor(key = 'leonsal-v2-local-profiles') {
      super();
      this.key = key;
      this.value = {
        activeId: 'default',
        profiles: [{ id: 'default', name: 'Shared play' }]
      };
      this.load();
    }
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(this.key) || '{}');
        if (saved && typeof saved === 'object') {
          const profiles = Array.isArray(saved.profiles) ? saved.profiles.filter((profile) => profile?.id && profile?.name) : [];
          this.value = {
            activeId: saved.activeId || profiles[0]?.id || 'default',
            profiles: profiles.length ? profiles : this.value.profiles
          };
        }
      } catch (_error) {
        /* Local profiles are optional. */
      }
      if (!this.value.profiles.some((profile) => profile.id === this.value.activeId)) this.value.activeId = this.value.profiles[0].id;
    }
    save() {
      try { localStorage.setItem(this.key, JSON.stringify(this.value)); } catch (_error) { /* optional */ }
      this.emit('save', this.value);
    }
    activeProfile() {
      return this.value.profiles.find((profile) => profile.id === this.value.activeId) || this.value.profiles[0];
    }
    progressKey(id = this.value.activeId) {
      return id === 'default' ? 'leonsal-v2-profile-progress' : `leonsal-v2-profile-progress:${id}`;
    }
    setActive(id) {
      if (!this.value.profiles.some((profile) => profile.id === id)) return;
      this.value.activeId = id;
      this.save();
    }
    add(name) {
      const clean = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 24);
      if (!clean) return null;
      const id = `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      this.value.profiles.push({ id, name: clean });
      this.value.activeId = id;
      this.save();
      return id;
    }
    remove(id) {
      if (id === 'default') return false;
      this.value.profiles = this.value.profiles.filter((profile) => profile.id !== id);
      try { localStorage.removeItem(this.progressKey(id)); } catch (_error) { /* optional */ }
      if (!this.value.profiles.some((profile) => profile.id === this.value.activeId)) this.value.activeId = 'default';
      this.save();
      return true;
    }
  }

  class SensoryMixerEngine extends EventBus {
    constructor(settings, options = {}) {
      super();
      this.settings = settings;
      this.key = options.key || 'leonsal-v2-sensory-worlds';
      this.presets = options.presets || [
        { id: 'quiet-glow', name: 'Quiet Glow', visualTheme: 'glow', motionRequest: false, soundRequest: false, particleRequest: 'off', speedRequest: 'slow', calmCompatible: true, reducedMotionFallback: 'static-glow', exitAlwaysAvailable: true },
        { id: 'bubble-calm', name: 'Bubble Calm', visualTheme: 'bubbles', motionRequest: true, soundRequest: false, particleRequest: 'low', speedRequest: 'slow', calmCompatible: true, reducedMotionFallback: 'tap-bubbles', exitAlwaysAvailable: true },
        { id: 'star-trail', name: 'Star Trail', visualTheme: 'stars', motionRequest: true, soundRequest: false, particleRequest: 'gentle', speedRequest: 'medium', calmCompatible: true, reducedMotionFallback: 'still-stars', exitAlwaysAvailable: true }
      ];
      this.savedWorlds = [];
      this.load();
    }
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(this.key) || '[]');
        if (Array.isArray(saved)) this.savedWorlds = saved.filter((world) => world?.id && world?.presetId);
      } catch (_error) {
        /* Saved worlds are optional. */
      }
    }
    save() {
      try { localStorage.setItem(this.key, JSON.stringify(this.savedWorlds)); } catch (_error) { /* optional */ }
      this.emit('save', this.savedWorlds);
    }
    capPreset(preset) {
      const current = this.settings.value;
      const capped = {
        motion: Boolean(preset.motionRequest && this.settings.allowsMotion()),
        sound: Boolean(preset.soundRequest && current.sound),
        vibration: false,
        particles: current.calmMode ? 'off' : this.capParticles(preset.particleRequest, current.particles),
        speed: this.capSpeed(preset.speedRequest, current.speed),
        visualTheme: preset.visualTheme,
        reducedMotionFallback: current.reducedMotion ? preset.reducedMotionFallback : null,
        exitAlwaysAvailable: preset.exitAlwaysAvailable === true
      };
      return capped;
    }
    capParticles(requested = 'gentle', current = 'gentle') {
      const rank = { off: 0, low: 1, gentle: 2 };
      const capped = Math.min(rank[requested] ?? 2, rank[current] ?? 2);
      return Object.keys(rank).find((key) => rank[key] === capped) || 'off';
    }
    capSpeed(requested = 'medium', current = 'medium') {
      const aliases = { normal: 'medium', lively: 'fast' };
      const cleanRequested = aliases[requested] || requested;
      const cleanCurrent = aliases[current] || current;
      const rank = { 'super-slow': 0, slow: 1, medium: 2, fast: 3, 'super-speed': 4 };
      const capped = Math.min(rank[cleanRequested] ?? 2, rank[cleanCurrent] ?? 2);
      return Object.keys(rank).find((key) => rank[key] === capped) || 'slow';
    }
    applyPreset(id) {
      const preset = this.presets.find((item) => item.id === id);
      if (!preset) return null;
      const world = { id: `world-${Date.now().toString(36)}`, presetId: id, name: preset.name, effective: this.capPreset(preset), savedAt: new Date().toISOString() };
      this.savedWorlds.unshift(world);
      this.savedWorlds = this.savedWorlds.slice(0, 6);
      this.save();
      this.emit('apply', world);
      return world;
    }
  }

  class HintFeedbackEngine extends EventBus {
    constructor(options = {}) {
      super();
      this.messages = options.messages || {};
      this.neutral = options.neutral || 'Try another way.';
      this.history = [];
    }
    hint(key = 'default', data = {}) {
      const message = this.messages[key] || this.neutral;
      const result = { type: 'hint', key, message, data };
      this.history.push(result);
      this.emit('hint', result);
      return result;
    }
    success(message = 'You did it.', data = {}) {
      const result = { type: 'success', message, data };
      this.history.push(result);
      this.emit('success', result);
      return result;
    }
    reset() {
      this.history = [];
      this.emit('reset');
    }
  }

  return {
    EventBus,
    SensorySettings,
    MotionEngine,
    StateMachine,
    AudioEngine,
    InputEngine,
    ParticleEngine,
    TrailEngine,
    GaugeBattery,
    DragDropEngine,
    RewardEngine,
    TraceEngine,
    SortMatchEngine,
    SequenceEngine,
    OrbitEngine,
    BuildAssemblyEngine,
    RhythmEngine,
    BalanceTiltEngine,
    CauseEffectEngine,
    TimeCycleEngine,
    CalmWorldEngine,
    MemoryRecallEngine,
    PhysicsPlayEngine,
    CharacterStateAnimationEngine,
    WorldShellProgressEngine,
    AssetLoaderEngine,
    PerformanceMonitorEngine,
    ProfileProgressStoreEngine,
    LocalProfileEngine,
    SensoryMixerEngine,
    HintFeedbackEngine,
    SettingsPanel,
    clamp,
    lerp,
    easeOutCubic,
    stateForEnergy,
    stateLabels
  };
})();
