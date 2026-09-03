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
        vibration: false,
        calmMode: false,
        particles: 'gentle',
        confetti: false,
        reducedMotion: prefersReducedMotion.matches
      };
      this.load();
      prefersReducedMotion.addEventListener?.('change', () => {
        this.set({ reducedMotion: prefersReducedMotion.matches, motion: !prefersReducedMotion.matches && this.value.motion });
      });
    }
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(this.key) || '{}');
        this.value = { ...this.value, ...saved, reducedMotion: prefersReducedMotion.matches };
      } catch (_error) {
        /* Preferences are optional. */
      }
    }
    save() {
      try { localStorage.setItem(this.key, JSON.stringify(this.value)); } catch (_error) { /* optional */ }
    }
    set(patch) {
      this.value = { ...this.value, ...patch };
      this.save();
      this.emit('settings-change', this.value);
    }
    allowsMotion() { return this.value.motion && !this.value.reducedMotion; }
    particleCount(base) {
      if (this.value.calmMode || this.value.particles === 'off') return 0;
      if (this.value.particles === 'low') return Math.ceil(base * 0.4);
      return base;
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
        vibration: 'Vibration',
        calmMode: 'Calm Mode',
        confetti: 'Confetti'
      };
      this.render();
    }
    render() {
      this.host.innerHTML = this.keys.map((key) => {
        const pressed = Boolean(this.settings.value[key]);
        return `<button class="v2-setting-pill" type="button" data-key="${key}" aria-pressed="${pressed}"><span></span>${this.labels[key] || key}</button>`;
      }).join('');
      this.host.querySelectorAll('[data-key]').forEach((button) => {
        button.addEventListener('click', () => {
          this.settings.set({ [button.dataset.key]: !this.settings.value[button.dataset.key] });
          this.render();
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
    }
    add(step) {
      this.items.add(step);
      this.start();
      return () => this.items.delete(step);
    }
    start() {
      if (this.frame) return;
      this.last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        for (const step of this.items) step(dt, now);
        this.frame = this.items.size ? requestAnimationFrame(tick) : 0;
      };
      this.frame = requestAnimationFrame(tick);
    }
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
      const start = performance.now();
      const remove = this.add((_dt, now) => {
        const t = clamp((now - start) / duration, 0, 1);
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
    }
    ensure() {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx ||= new Ctx();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }
    tone(type = 'tap') {
      if (!this.settings.value.sound) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.frequency.value = type === 'success' ? 520 : 360;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
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
      this.cleanups.push(() => {
        clearHold();
        this.host.removeEventListener('pointerdown', onDown);
        this.host.removeEventListener('pointermove', onMove);
        this.host.removeEventListener('pointerup', onUp);
        this.host.removeEventListener('pointercancel', onUp);
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
      this.set(0);
    }
    set(energy) {
      const value = clamp(Number(energy) || 0, 0, 100);
      const state = stateForEnergy(value);
      this.fill?.setAttribute('width', String(3.12 * value));
      this.fill?.setAttribute('fill', { empty: '#ef6f66', low: '#f29b48', calm: '#f3d24f', happy: '#4aa8ff', excited: '#45c56b' }[state]);
      if (this.face) {
        const mouths = {
          empty: 'M174 138 Q198 120 222 138',
          low: 'M176 137 Q198 128 220 137',
          calm: 'M176 132 Q198 142 220 132',
          happy: 'M174 130 Q198 150 222 130',
          excited: 'M170 128 Q198 154 226 128'
        };
        this.face.setAttribute('d', mouths[state]);
      }
      if (this.label) this.label.textContent = `${Math.round(value)}%`;
      this.svg.dataset.energyState = state;
      return { value, state, label: stateLabels[state] };
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
      this.items = Array.from({ length: this.settings.particleCount(count) }, () => ({
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
      this.seed(type);
      this.remove = this.motion.add((dt) => this.step(dt));
    }
    step(dt) {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
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
      const index = this.items.findIndex((item) => Math.hypot(item.x - x, item.y - y) <= item.r + 12);
      if (index < 0) return false;
      const hit = this.items[index];
      this.items.splice(index, 1);
      const burstCount = this.settings.value.calmMode ? 0 : 6;
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
      if (!this.settings.value.calmMode) this.emit(x, y);
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
      this.emitters.forEach((item) => { item.age += dt; item.y -= dt * 10; });
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
      this.audio.tone('success');
      if (this.settings.value.confetti && !this.settings.value.calmMode) this.particles?.seed('stars', 18);
      return message;
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
      window.addEventListener('resize', () => this.resize());
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
    constructor(motion, settings) { super(); this.motion = motion; this.settings = settings; this.items = new Set(); this.remove = null; }
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
    setSpeed(scale) { for (const item of this.items) item.speed = item.baseSpeed * scale; }
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
    SettingsPanel,
    clamp,
    lerp,
    easeOutCubic,
    stateForEnergy,
    stateLabels
  };
})();
