'use strict';
(async () => {
  const energy = document.getElementById('energy');
  const picture = document.getElementById('characterImage');
  const status = document.getElementById('imageStatus');
  const buttons = document.getElementById('poseButtons');
  let generation = 0;
  document.getElementById('darkBackground').addEventListener('change', event => {
    document.getElementById('reviewStage').classList.toggle('dark', event.target.checked);
  });
  try {
    const response = await fetch('data/character-review.json');
    if (!response.ok) throw new Error('Review unavailable');
    const review = await response.json();
    if (review.status !== 'review-only' || review.productionApproved !== false) throw new Error('Invalid review record');
    const character = review.character;
    document.getElementById('reviewNotes').textContent = character.notes;
    async function render() {
      const revision = ++generation;
      const state = LeonSalV2.stateForEnergy(energy.value);
      document.getElementById('energyValue').textContent = `${energy.value}%`;
      document.getElementById('poseName').textContent = LeonSalV2.stateLabels[state];
      energy.setAttribute('aria-valuetext', `${energy.value} percent, ${LeonSalV2.stateLabels[state]}`);
      for (const button of buttons.children) button.setAttribute('aria-pressed', String(button.dataset.state === state));
      picture.hidden = true; status.hidden = false; status.textContent = 'Loading pose…';
      const candidate = new Image(); candidate.src = character.states[state].src;
      try {
        await candidate.decode();
        if (revision !== generation) return;
        picture.src = candidate.src; picture.alt = `${character.name}: ${LeonSalV2.stateLabels[state]} — review candidate`;
        picture.dataset.state = state; picture.hidden = false; status.hidden = true;
      } catch {
        if (revision !== generation) return;
        status.textContent = 'This pose could not load. Choose another pose or reload the page.';
      }
    }
    for (const [state, value] of Object.entries({empty:0, low:25, calm:50, happy:75, excited:100})) {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = state[0].toUpperCase() + state.slice(1); button.dataset.state = state;
      button.addEventListener('click', () => { energy.value = value; render(); }); buttons.append(button);
    }
    energy.disabled = false; energy.addEventListener('input', render);
    // Reference sheets load only if the reviewer opens this section.
    document.querySelector('.review-references').addEventListener('toggle', event => {
      const container = document.getElementById('referenceImages');
      if (!event.target.open || container.childElementCount) return;
      for (const reference of review.references) {
        const figure = document.createElement('figure'); const img = new Image();
        img.src = reference.src; img.alt = reference.name; img.loading = 'lazy';
        const caption = document.createElement('figcaption'); caption.textContent = `${reference.name}. ${reference.notes}`;
        figure.append(img, caption); container.append(figure);
      }
    });
    await render();
  } catch { status.textContent = 'The artwork review is unavailable. You can return to the activities above.'; }
})();
