'use strict';
  // Finger Light Trail
  const canvas = elements.trailCanvas;
  const trailContext = canvas.getContext('2d');
  let trailColour = '#348de3';
  let trailDrawing = false;
  let trailLastPoint = null;
  let trailKeyboardPoint = null;

  function resizeTrailCanvas() {
    if (!canvas || !trailContext) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * ratio);
    const height = Math.round(rect.height * ratio);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    trailContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    trailContext.lineCap = 'round';
    trailContext.lineJoin = 'round';
    trailContext.lineWidth = 18;
    trailKeyboardPoint = { x: rect.width / 2, y: rect.height / 2 };
    elements.trailStatus.textContent = 'The board is ready for a finger trail.';
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function drawTrailSegment(from, to) {
    if (!trailContext) return;
    trailContext.strokeStyle = trailColour;
    trailContext.fillStyle = trailColour;
    trailContext.lineWidth = 18;
    if (!from) {
      trailContext.beginPath();
      trailContext.arc(to.x, to.y, 9, 0, Math.PI * 2);
      trailContext.fill();
      return;
    }
    trailContext.beginPath();
    trailContext.moveTo(from.x, from.y);
    trailContext.lineTo(to.x, to.y);
    trailContext.stroke();
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    trailDrawing = true;
    trailLastPoint = canvasPoint(event);
    drawTrailSegment(null, trailLastPoint);
    try { canvas.setPointerCapture(event.pointerId); } catch (_error) { /* optional */ }
    elements.trailStatus.textContent = 'Your light trail is drawing.';
    vibrate(8);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!trailDrawing) return;
    event.preventDefault();
    const events = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
    events.forEach((moveEvent) => {
      const point = canvasPoint(moveEvent);
      drawTrailSegment(trailLastPoint, point);
      trailLastPoint = point;
    });
  });

  function stopTrail(event) {
    if (!trailDrawing) return;
    if (event) event.preventDefault();
    trailDrawing = false;
    trailLastPoint = null;
    elements.trailStatus.textContent = 'Trail complete. Draw more or choose a new colour.';
  }
  canvas.addEventListener('pointerup', stopTrail);
  canvas.addEventListener('pointercancel', stopTrail);
  canvas.addEventListener('lostpointercapture', stopTrail);
  canvas.addEventListener('keydown', (event) => {
    const arrows = { ArrowUp: [0, -16], ArrowDown: [0, 16], ArrowLeft: [-16, 0], ArrowRight: [16, 0] };
    const rect = canvas.getBoundingClientRect();
    if (event.key === ' ') {
      event.preventDefault();
      trailKeyboardPoint = trailKeyboardPoint || { x: rect.width / 2, y: rect.height / 2 };
      drawTrailSegment(null, trailKeyboardPoint);
      elements.trailStatus.textContent = 'A light dot was added.';
      return;
    }
    if (!arrows[event.key]) return;
    event.preventDefault();
    trailKeyboardPoint = trailKeyboardPoint || { x: rect.width / 2, y: rect.height / 2 };
    const [moveX, moveY] = arrows[event.key];
    const nextPoint = {
      x: clamp(trailKeyboardPoint.x + moveX, 10, Math.max(10, rect.width - 10)),
      y: clamp(trailKeyboardPoint.y + moveY, 10, Math.max(10, rect.height - 10))
    };
    drawTrailSegment(trailKeyboardPoint, nextPoint);
    trailKeyboardPoint = nextPoint;
    elements.trailStatus.textContent = 'Arrow-key light trail is drawing.';
  });

  $$('.colour-dot').forEach((button) => {
    button.addEventListener('click', () => {
      trailColour = button.dataset.colour;
      $$('.colour-dot').forEach((colourButton) => {
        const selected = colourButton === button;
        colourButton.classList.toggle('is-selected', selected);
        colourButton.setAttribute('aria-pressed', String(selected));
      });
      elements.trailStatus.textContent = `${button.getAttribute('aria-label')} selected.`;
      playTone('tap');
      vibrate(8);
    });
  });

  function clearTrail(options = {}) {
    if (!trailContext) return;
    trailContext.clearRect(0, 0, canvas.width, canvas.height);
    const rect = canvas.getBoundingClientRect();
    trailKeyboardPoint = { x: rect.width / 2, y: rect.height / 2 };
    elements.trailStatus.textContent = 'The board is clear and ready.';
    if (options.announce !== false) announce('Finger trail board cleared.');
  }
  elements.clearTrail.addEventListener('click', clearTrail);

  function resetExperience() {
    cancelEnergyAnimation();
    state = { ...defaults, motion: !prefersReducedMotion.matches };
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_error) { /* optional */ }
    renderSettings();
    renderEnergy();
    renderFeeling(null, { openPanel: false });
    $$('.feeling-button').forEach((button) => button.setAttribute('aria-pressed', 'false'));
    dashDocked = false;
    updateDash(0, { award: false });
    resetBubbles({ announce: false });
    pattern = [shapes[0], shapes[1], shapes[3]];
    patternIndex = 0;
    patternRewarded = false;
    renderPattern();
    elements.patternStatus.textContent = 'Look at the pattern, then copy it.';
    stopBreathing();
    renderBreath(0);
    clearTrail({ announce: false });
    selectPanel('dash', false);
    saveState();
    announce('LeonSal was reset. Sound and vibration are off.');
  }
  elements.resetAll.addEventListener('click', resetExperience);

  // Keep interactive movement accurate after phone rotation or resizing.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      updateDash(Number(elements.dashSlider.value), { award: false });
      if (!$('#panel-draw').hidden) resizeTrailCanvas();
    }, 100);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopBreathing();
      trailDrawing = false;
      trailLastPoint = null;
    }
  });

  // Initial render.
  renderSettings();
  renderEnergy();
  renderFeeling(state.feeling, { openPanel: false });
  selectPanel('dash', false);
  resetBubbles({ announce: false });
  renderPattern();
  updateDash(0, { award: false });
