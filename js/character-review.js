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
    const characters = review.characters || [review.character];
    let character = characters[0];
    const selector = document.getElementById('reviewCharacter');
    const format = document.getElementById('artFormat');
    const characterCards = document.getElementById('characterCards');
    const stateName = state => state[0].toUpperCase() + state.slice(1);
    const srcFor = (item, state) => {
      const asset = item.states[state];
      if (!asset) return '';
      return format.value === 'vector' && asset.vectorSrc ? asset.vectorSrc : asset.src;
    };
    format.addEventListener('change', render);
    for (const item of characters) {
      const option = document.createElement('option'); option.value = item.id; option.textContent = item.name; selector.append(option);
    }
    const makeCard = item => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'character-card';
      card.dataset.character = item.id;
      const image = new Image();
      image.alt = '';
      image.decoding = 'async';
      image.loading = 'lazy';
      image.src = srcFor(item, item.states.excited ? 'excited' : Object.keys(item.states)[0]);
      const label = document.createElement('strong');
      label.textContent = item.name;
      const count = document.createElement('span');
      count.textContent = `${Object.keys(item.states).length}/5 states`;
      card.append(image, label, count);
      card.addEventListener('click', () => {
        selector.value = item.id;
        character = item;
        document.getElementById('reviewNotes').textContent = character.notes;
        render();
      });
      return card;
    };
    characterCards.replaceChildren(...characters.map(makeCard));
    function renderRunners() {
      const leon = characters.find(item => item.id === 'leon');
      const zaya = characters.find(item => item.id === 'zaya');
      const leonImg = document.querySelector('[data-runner="leon"]');
      const zayaImg = document.querySelector('[data-runner="zaya"]');
      if (leon && leonImg) leonImg.src = srcFor(leon, 'happy') || srcFor(leon, 'calm');
      if (zaya && zayaImg) zayaImg.src = srcFor(zaya, 'excited') || srcFor(zaya, 'happy');
    }
    selector.addEventListener('change', () => {
      character = characters.find(item => item.id === selector.value);
      document.getElementById('reviewNotes').textContent = character.notes;
      render();
    });
    document.getElementById('reviewNotes').textContent = character.notes;
    async function render() {
      const revision = ++generation;
      const state = LeonSalV2.stateForEnergy(energy.value);
      document.getElementById('energyValue').textContent = `${energy.value}%`;
      document.getElementById('poseName').textContent = LeonSalV2.stateLabels[state];
      energy.setAttribute('aria-valuetext', `${energy.value} percent, ${LeonSalV2.stateLabels[state]}`);
      for (const button of buttons.children) button.setAttribute('aria-pressed', String(button.dataset.state === state));
      for (const card of characterCards.children) card.classList.toggle('is-active', card.dataset.character === character.id);
      picture.hidden = true; status.hidden = false; status.textContent = 'Loading pose…';
      picture.removeAttribute('src'); picture.dataset.character = character.id; picture.dataset.state = state;
      if (!character.states[state]) {
        status.textContent = `${character.name}'s ${state} artwork has not been supplied.`;
        return;
      }
      const candidate = new Image();
      const asset = character.states[state];
      candidate.src = srcFor(character, state);
      try {
        await candidate.decode();
        if (revision !== generation) return;
        picture.src = candidate.src; picture.alt = `${character.name}: ${LeonSalV2.stateLabels[state]} — review candidate`;
        picture.dataset.format = format.value === 'vector' && asset.vectorSrc ? 'vector' : 'original';
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
    renderRunners();
    await render();
  } catch { status.textContent = 'The artwork review is unavailable. You can return to the activities above.'; }
})();
