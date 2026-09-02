'use strict';
  // Dash to Dock
  let dashDocked = false;

  function dashTravelDistance() {
    const lane = elements.dashLane;
    const buddy = elements.dashBuddy;
    const dock = $('.charge-dock', lane);
    if (!lane || !buddy || !dock) return 0;
    const startLeft = 15;
    const targetLeft = dock.offsetLeft + ((dock.offsetWidth - buddy.offsetWidth) / 2);
    return Math.max(0, targetLeft - startLeft);
  }

  function updateDash(value, options = {}) {
    const amount = clamp(Number(value) || 0, 0, 100);
    elements.dashSlider.value = String(amount);
    elements.root.style.setProperty('--dash-position', `${amount}%`);
    elements.root.style.setProperty('--dash-x', `${dashTravelDistance() * amount / 100}px`);
    elements.dashSlider.setAttribute('aria-valuetext', `${Math.round(amount)} percent of the way to the charging dock`);

    if (amount >= 94) {
      elements.dashStatus.textContent = dashDocked ? 'Bolt is at the charging dock.' : 'Bolt reached the charging dock!';
      if (!dashDocked && options.award !== false) {
        dashDocked = true;
        setEnergy(state.energy + 15);
        playTone('success');
        vibrate([18, 45, 18]);
        announce('Bolt reached the dock and gained 15 battery energy.');
      }
    } else {
      if (amount < 84) dashDocked = false;
      if (amount <= 2) elements.dashStatus.textContent = 'Bolt is at the start.';
      else if (amount < 45) elements.dashStatus.textContent = 'Bolt is moving toward the dock.';
      else if (amount < 84) elements.dashStatus.textContent = 'More than halfway. Keep moving when ready.';
      else elements.dashStatus.textContent = 'The charging dock is very close.';
    }
  }

  elements.dashSlider.addEventListener('input', (event) => updateDash(event.currentTarget.value));
  elements.dashSlider.addEventListener('change', () => {
    playTone('tap');
    vibrate(10);
  });
  elements.dashLeft.addEventListener('click', () => {
    updateDash(Number(elements.dashSlider.value) - 10);
    playTone('tap');
    vibrate(10);
  });
  elements.dashRight.addEventListener('click', () => {
    updateDash(Number(elements.dashSlider.value) + 10);
    playTone('tap');
    vibrate(10);
  });
  elements.dashReset.addEventListener('click', () => {
    dashDocked = false;
    updateDash(0, { award: false });
    announce('Dash returned to the start.');
  });

  // Quiet Bubbles
  const bubbleButtons = $$('.bubble', elements.bubbleGrid);
  let bubblesLeft = bubbleButtons.length;
  let bubbleRoundRewarded = false;

  function renderBubbleStatus() {
    if (bubblesLeft === 0) {
      elements.bubbleStatus.textContent = 'All quiet. Make more bubbles whenever you want.';
    } else if (bubblesLeft === 1) {
      elements.bubbleStatus.textContent = '1 quiet bubble is left.';
    } else {
      elements.bubbleStatus.textContent = `${bubblesLeft} quiet bubbles are ready.`;
    }
  }

  function resetBubbles(options = {}) {
    bubblesLeft = bubbleButtons.length;
    bubbleRoundRewarded = false;
    bubbleButtons.forEach((bubble) => {
      bubble.classList.remove('is-popped');
      bubble.disabled = false;
    });
    renderBubbleStatus();
    if (options.announce !== false) announce('Eight quiet bubbles are ready again.');
  }

  bubbleButtons.forEach((bubble) => {
    bubble.addEventListener('click', () => {
      if (bubble.classList.contains('is-popped')) return;
      bubble.classList.add('is-popped');
      bubble.disabled = true;
      bubblesLeft = Math.max(0, bubblesLeft - 1);
      renderBubbleStatus();
      playTone('tap');
      vibrate(10);

      if (bubblesLeft === 0 && !bubbleRoundRewarded) {
        bubbleRoundRewarded = true;
        setEnergy(state.energy + 5);
        playTone('success');
        announce('All bubbles are quiet. Bolt gained 5 battery energy.');
      }
    });
  });
  elements.bubbleReset.addEventListener('click', () => resetBubbles());

  // Hold to Breathe & Charge
  let breathing = false;
  let breathStart = 0;
  let breathFrame = 0;
  let breathProgress = 0;
  let breathResetTimer = 0;

  function renderBreath(progress) {
    breathProgress = clamp(progress, 0, 100);
    elements.root.style.setProperty('--breath-progress', `${breathProgress}%`);
    elements.root.style.setProperty('--breath-number', String(breathProgress));
    elements.breathePercent.textContent = `${Math.round(breathProgress)}%`;
  }

  function breathLoop(now) {
    if (!breathing) return;
    const progress = Math.min(100, ((now - breathStart) / 5000) * 100);
    renderBreath(progress);
    if (progress >= 100) {
      elements.breatheStatus.textContent = 'A full slow breath. Let go when you are ready.';
    } else {
      elements.breatheStatus.textContent = 'Slowly breathe in while you hold.';
    }
    breathFrame = window.requestAnimationFrame(breathLoop);
  }

  function startBreathing(event) {
    if (breathing) return;
    if (event) event.preventDefault();
    window.clearTimeout(breathResetTimer);
    breathing = true;
    breathStart = performance.now() - ((breathProgress / 100) * 5000);
    elements.breatheOrb.classList.add('is-holding');
    $('.breathe-text', elements.breatheOrb).textContent = 'Breathe in';
    elements.breatheStatus.textContent = 'Slowly breathe in while you hold.';
    if (event?.pointerId !== undefined) {
      try { elements.breatheOrb.setPointerCapture(event.pointerId); } catch (_error) { /* optional */ }
    }
    breathFrame = window.requestAnimationFrame(breathLoop);
  }

  function stopBreathing(event) {
    if (!breathing) return;
    if (event) event.preventDefault();
    breathing = false;
    window.cancelAnimationFrame(breathFrame);
    elements.breatheOrb.classList.remove('is-holding');
    $('.breathe-text', elements.breatheOrb).textContent = 'Press & hold';

    if (breathProgress >= 50) {
      setEnergy(state.energy + 4);
      elements.breatheStatus.textContent = 'Now slowly breathe out. Bolt gained gentle energy.';
      playTone('success');
      vibrate(18);
      announce('Slow breath complete. Bolt gained 4 battery energy.');
    } else {
      elements.breatheStatus.textContent = 'Now slowly breathe out. A short breath is okay too.';
      playTone('tap');
    }

    breathResetTimer = window.setTimeout(() => {
      renderBreath(0);
      elements.breatheStatus.textContent = 'Start again whenever your body is ready.';
    }, state.motion ? 1100 : 100);
  }

  elements.breatheOrb.addEventListener('pointerdown', startBreathing);
  elements.breatheOrb.addEventListener('pointerup', stopBreathing);
  elements.breatheOrb.addEventListener('pointercancel', stopBreathing);
  elements.breatheOrb.addEventListener('lostpointercapture', stopBreathing);
  elements.breatheOrb.addEventListener('click', (event) => event.preventDefault());
  elements.breatheOrb.addEventListener('keydown', (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) startBreathing(event);
  });
  elements.breatheOrb.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.key === 'Enter') stopBreathing(event);
  });

  // Copy the Pattern
  const shapes = [
    { key: 'circle', symbol: '●', name: 'circle', colour: '#348de3' },
    { key: 'triangle', symbol: '▲', name: 'triangle', colour: '#e2a900' },
    { key: 'square', symbol: '■', name: 'square', colour: '#2aa98f' },
    { key: 'star', symbol: '★', name: 'star', colour: '#df5f97' }
  ];
  let pattern = [shapes[0], shapes[1], shapes[3]];
  let patternIndex = 0;
  let patternRewarded = false;

  function randomPattern() {
    const result = [];
    for (let index = 0; index < 3; index += 1) {
      result.push(shapes[Math.floor(Math.random() * shapes.length)]);
    }
    return result;
  }

  function renderPattern() {
    elements.patternTarget.replaceChildren();
    elements.patternOptions.replaceChildren();
    elements.patternProgress.replaceChildren();
    elements.patternTarget.setAttribute('aria-label', `Pattern: ${pattern.map((shape) => shape.name).join(', ')}`);

    pattern.forEach((shape) => {
      const tile = document.createElement('span');
      tile.className = 'pattern-shape';
      tile.textContent = shape.symbol;
      tile.style.color = shape.colour;
      tile.setAttribute('aria-hidden', 'true');
      elements.patternTarget.appendChild(tile);
    });

    shapes.forEach((shape) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pattern-choice';
      button.dataset.shape = shape.key;
      button.textContent = shape.symbol;
      button.style.color = shape.colour;
      button.setAttribute('aria-label', shape.name);
      button.addEventListener('click', () => choosePatternShape(shape, button));
      elements.patternOptions.appendChild(button);
    });

    pattern.forEach((_shape, index) => {
      const dot = document.createElement('span');
      dot.className = `pattern-progress-dot${index < patternIndex ? ' is-done' : ''}`;
      dot.setAttribute('aria-hidden', 'true');
      elements.patternProgress.appendChild(dot);
    });
  }

  function choosePatternShape(shape, button) {
    if (patternIndex >= pattern.length) {
      elements.patternStatus.textContent = 'Pattern complete. Choose New pattern to play again.';
      return;
    }

    const expected = pattern[patternIndex];
    if (shape.key === expected.key) {
      patternIndex += 1;
      renderPattern();
      playTone('tap');
      vibrate(10);
      if (patternIndex === pattern.length) {
        elements.patternStatus.textContent = 'Pattern complete! Your progress stayed safe.';
        if (!patternRewarded) {
          patternRewarded = true;
          setEnergy(state.energy + 5);
        }
        playTone('success');
        announce('Pattern complete. Bolt gained 5 battery energy.');
      } else {
        elements.patternStatus.textContent = `${patternIndex} of ${pattern.length} shapes matched.`;
      }
    } else {
      button.classList.remove('is-gentle-wrong');
      // Restart the short nudge even when the same choice is tapped again.
      void button.offsetWidth;
      button.classList.add('is-gentle-wrong');
      elements.patternStatus.textContent = 'That one is different. Look again. Nothing was lost.';
      window.setTimeout(() => button.classList.remove('is-gentle-wrong'), 420);
    }
  }

  function newPattern() {
    pattern = randomPattern();
    patternIndex = 0;
    patternRewarded = false;
    renderPattern();
    elements.patternStatus.textContent = 'Look at the new pattern, then copy it.';
    announce('A new three-shape pattern is ready.');
  }
  elements.newPattern.addEventListener('click', newPattern);

