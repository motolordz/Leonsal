'use strict';
(async () => {
  const energy = document.getElementById('energy');
  const picture = document.getElementById('characterImage');
  const status = document.getElementById('imageStatus');
  const buttons = document.getElementById('poseButtons');
  const stateStrip = document.getElementById('stateStrip');
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
    const readinessGrid = document.getElementById('readinessGrid');
    const reviewSummary = document.getElementById('reviewSummary');
    const productionTruth = document.getElementById('productionTruth');
    const sourceIntake = document.getElementById('sourceIntake');
    const candidateLibrary = document.getElementById('candidateLibrary');
    const productionBatches = document.getElementById('productionBatches');
    const familyEvidence = document.getElementById('familyEvidence');
    const gateMatrix = document.getElementById('gateMatrix');
    const reviewFilters = [...document.querySelectorAll('[data-review-filter]')];
    let reviewFilter = 'all';
    let readinessReport = null;
    const stateName = state => state[0].toUpperCase() + state.slice(1);
    const familyFor = item => item.family || (['leon', 'zaya'].includes(item.id) ? 'guide' : 'world');
    const statesFor = item => ['empty', 'low', 'calm', 'happy', 'excited'].filter((state) => Boolean(item.states[state]));
    const matchesFilter = item => {
      const supplied = statesFor(item).length;
      if (reviewFilter === 'needs-states') return supplied < 5;
      if (reviewFilter === 'five-state') return supplied === 5;
      if (reviewFilter === 'guide') return familyFor(item) === 'guide';
      if (reviewFilter === 'world') return familyFor(item) === 'world';
      return true;
    };
    const srcFor = (item, state) => {
      const asset = item.states[state];
      if (!asset) return '';
      return format.value === 'vector' && asset.vectorSrc ? asset.vectorSrc : asset.src;
    };
    const registryGroups = registry => ['guides', 'alphabet', 'numbers', 'world', 'planets']
      .flatMap(group => (registry[group] || []).map(item => ({ ...item, registryGroup: group })));
    const renderSourceIntake = () => {
      if (!sourceIntake) return;
      const requiredStates = ['empty', 'low', 'calm', 'happy', 'excited'];
      const sourceAssets = characters.reduce((sum, item) => sum + Object.values(item.states || {}).filter(asset => asset.source).length, 0);
      const reviewAssets = characters.reduce((sum, item) => sum + Object.values(item.states || {}).filter(asset => asset.src).length, 0);
      const missing = characters.flatMap(item => requiredStates
        .filter(state => !item.states[state])
        .map(state => `${item.name} ${stateName(state)}`));
      const blockers = [
        missing.length ? `${missing.length} missing state${missing.length === 1 ? '' : 's'}` : null,
        'review-only sources below production master size',
        'guide clothing/name treatment still needs production cleanup'
      ].filter(Boolean);
      sourceIntake.innerHTML = `<article><strong>${sourceAssets}</strong><span>supplied transparent source poses</span></article><article><strong>${reviewAssets}</strong><span>optimized review images</span></article><article><strong>${missing.length}</strong><span>missing five-state slots</span></article><p><b>Next production blockers:</b> ${blockers.join(' · ')}.</p>`;
    };
    const renderCandidateLibrary = async () => {
      if (!candidateLibrary) return;
      try {
        const reportResponse = await fetch('qa/character-production-v3/READINESS/character-readiness-report.json');
        if (!reportResponse.ok) throw new Error('Readiness report unavailable');
        const report = await reportResponse.json();
        readinessReport = report;
        const summary = report.summary || {};
        const familyRows = Object.entries(report.familySummary || {})
          .map(([family, item]) => `<li><b>${family}</b>: ${item.approvedCharacters}/${item.characterCount} approved · ${item.pendingStateSlots} pending state slots · ${item.gateSummary?.visualQualityFailed || 0} visual blockers</li>`)
          .join('');
        const blockers = (report.characters || [])
          .filter(item => item.blockers?.length)
          .slice(0, 4)
          .map(item => `<li><b>${item.displayName}</b>: ${item.blockers[0]}</li>`)
          .join('');
        candidateLibrary.innerHTML = `<article><strong>${summary.pendingCharacters || 0}</strong><span>pending generated characters</span></article><article><strong>${(summary.pendingCharacters || 0) * 5}</strong><span>pending generated state slots</span></article><article><strong>${summary.pendingGeneratedVectorSources || 0}</strong><span>preserved vector sources</span></article><p><b>Candidate library:</b> Generated SVG-backed candidates are inspectable, but gameplay still resolves only approved art.</p><ul class="family-status-list">${familyRows}</ul><ul>${blockers}</ul>`;
      } catch {
        candidateLibrary.innerHTML = '<p>Candidate readiness report could not load. Registry checks still enforce approved-only runtime art.</p>';
      }
    };
    const renderGateMatrix = () => {
      if (!gateMatrix) return;
      const readiness = (readinessReport?.characters || []).find(item => item.id === character.id || item.id === `world-${character.id}`);
      if (!readiness?.gates) {
        gateMatrix.innerHTML = '<p>Production gate data is not available for this review source yet.</p>';
        return;
      }
      const labels = {
        fiveStateComplete: 'Five states',
        suppliedSourceComplete: 'Supplied source',
        productionResolution: 'Production size',
        transparentMasters: 'Transparency',
        runtimeExposure: 'Runtime boundary',
        visualQuality: 'Visual quality',
        identityConsistency: 'Identity',
        guideNameText: 'Name text',
        approvalStatus: 'Approval'
      };
      gateMatrix.innerHTML = `<h3>Production gates</h3><dl>${Object.entries(labels).map(([key, label]) => `<div data-gate="${readiness.gates[key]}"><dt>${label}</dt><dd>${readiness.gates[key]}</dd></div>`).join('')}</dl>`;
    };
    const renderProductionBatches = async () => {
      if (!productionBatches) return;
      try {
        const batchResponse = await fetch('qa/character-production-v3/READINESS/character-production-batches.json');
        if (!batchResponse.ok) throw new Error('Batch report unavailable');
        const report = await batchResponse.json();
        const batches = (report.batches || []).slice(0, 6);
        productionBatches.innerHTML = `<p><b>Production order:</b> ${batches.length} review batches, starting with Leon and Zaya.</p><ol>${batches.map((batch) => `<li><b>${batch.title}</b><span>${batch.characterCount} characters · ${batch.status}</span></li>`).join('')}</ol>`;
      } catch {
        productionBatches.innerHTML = '<p>Production batch report could not load.</p>';
      }
    };
    const renderFamilyEvidence = () => {
      if (!familyEvidence) return;
      const sheets = [
        ['Latest intake', 'Corrected 20260915 supplied source references', 'qa/character-production-v3/SUPPLIED-20260915/supplied-character-source-contact-sheet.png'],
        ['Guide pilot', 'Leon and Zaya generated style-direction sheet', 'qa/character-production-v3/LEON-ZAYA-GENUINE-PILOT/leon-zaya-five-state-generated-review.png'],
        ['Supplied poses', 'Elephant, Zaya and Leon source-state intake', 'qa/character-production-v3/READINESS/supplied-character-five-state-review.png'],
        ['Guides', 'Leon and Zaya five-state sheet', 'qa/character-production-v3/FAMILY-REVIEW/leon-zaya-five-states.png'],
        ['Alphabet', 'A-Z five-state sheet', 'qa/character-production-v3/FAMILY-REVIEW/alphabet-five-states.png'],
        ['Numbers', '1-10 five-state sheet', 'qa/character-production-v3/FAMILY-REVIEW/numbers-five-states.png'],
        ['World', 'World character five-state sheet', 'qa/character-production-v3/FAMILY-REVIEW/world-characters-five-states.png'],
        ['Planets', 'Planet five-state sheet', 'qa/character-production-v3/FAMILY-REVIEW/planets-five-states.png'],
        ['Full library', 'Complete pending library sheet', 'qa/character-production-v3/FINAL-REVIEW/leonsal-complete-character-library.png']
      ];
      familyEvidence.innerHTML = `<p><b>Family evidence:</b> Generated review sheets are shown here for visual inspection. These remain QA evidence, not gameplay assets.</p><div>${sheets.map(([family, label, href]) => `<a href="${href}"><img src="${href}" alt="" loading="lazy" decoding="async"><strong>${family}</strong><span>${label}</span></a>`).join('')}</div>`;
    };
    const renderProductionTruth = async () => {
      if (!productionTruth) return;
      try {
        const assetResponse = await fetch('data/character-assets.json');
        if (!assetResponse.ok) throw new Error('Registry unavailable');
        const registry = await assetResponse.json();
        const records = registryGroups(registry);
        const approved = records.filter(item => item.status === 'approved');
        const pending = records.filter(item => item.status !== 'approved');
        const familyCounts = ['guide', 'world', 'alphabet', 'number', 'planet'].map((family) => {
          const items = records.filter(item => item.family === family);
          const approvedCount = items.filter(item => item.status === 'approved').length;
          return `<article><strong>${family}</strong><span>${approvedCount}/${items.length} approved</span></article>`;
        }).join('');
        productionTruth.innerHTML = `<div><strong>${approved.length * 5}</strong><span>approved runtime state assets</span></div><div><strong>${pending.length * 5}</strong><span>pending/review state slots</span></div><p>${registry.runtimeRule || 'Only approved assets may resolve into gameplay.'}</p><section aria-label="Registry family approval counts">${familyCounts}</section>`;
      } catch {
        productionTruth.innerHTML = '<p>Production registry counts could not load. Runtime checks still fail closed.</p>';
      }
    };
    format.addEventListener('change', render);
    for (const item of characters) {
      const option = document.createElement('option'); option.value = item.id; option.textContent = item.name; selector.append(option);
    }
    const renderReadiness = () => {
      if (!readinessGrid) return;
      const states = ['empty', 'low', 'calm', 'happy', 'excited'];
      const counts = characters.reduce((memo, item) => {
        const supplied = statesFor(item).length;
        memo.total += 1;
        memo.fiveState += supplied === 5 ? 1 : 0;
        memo.needsStates += supplied < 5 ? 1 : 0;
        memo.reviewOnly += item.status === 'review-only' ? 1 : 0;
        return memo;
      }, { total: 0, fiveState: 0, needsStates: 0, reviewOnly: 0 });
      if (reviewSummary) {
        reviewSummary.innerHTML = `<article><strong>${counts.total}</strong><span>review characters</span></article><article><strong>${counts.fiveState}</strong><span>five-state sets</span></article><article><strong>${counts.needsStates}</strong><span>need states</span></article><article><strong>${counts.reviewOnly}</strong><span>review only</span></article>`;
      }
      readinessGrid.replaceChildren(...characters.filter(matchesFilter).map((item) => {
        const supplied = statesFor(item);
        const belowMasterSize = Object.values(item.states).some((asset) => Number(asset.width || 0) < 2048 || Number(asset.height || 0) < 2048);
        const missing = states.filter((state) => !item.states[state]).map(stateName);
        const blockers = [
          item.status !== 'approved' ? 'review-only' : null,
          supplied.length < 5 ? `missing ${missing.join(', ')}` : null,
          belowMasterSize ? 'below 2048 px master requirement' : null,
          /uppercase name|canonical uppercase name/i.test(item.notes || '') ? 'guide name needs canonical uppercase treatment' : null
        ].filter(Boolean);
        const card = document.createElement('article');
        card.className = 'readiness-card';
        card.dataset.character = item.id;
        card.innerHTML = `<h3>${item.name}</h3><p>${supplied.length}/5 states supplied · ${familyFor(item)}</p><div class="readiness-states" aria-label="${item.name} supplied states"></div><strong>${blockers.length ? 'Not production ready' : 'Ready for approval review'}</strong><small>${blockers.join(' · ') || 'All automated readiness blockers cleared.'}</small>`;
        const stateHost = card.querySelector('.readiness-states');
        stateHost.replaceChildren(...states.map((state) => {
          const dot = document.createElement('span');
          dot.textContent = stateName(state);
          dot.dataset.ready = String(Boolean(item.states[state]));
          return dot;
        }));
        return card;
      }));
    };
    reviewFilters.forEach((button) => {
      button.addEventListener('click', () => {
        reviewFilter = button.dataset.reviewFilter;
        reviewFilters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        renderReadiness();
      });
    });
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
    renderProductionTruth();
    renderSourceIntake();
    renderCandidateLibrary();
    renderProductionBatches();
    renderFamilyEvidence();
    renderReadiness();
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
      renderStateStrip(state);
      renderGateMatrix();
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
    function renderStateStrip(activeState) {
      if (!stateStrip) return;
      const states = ['empty', 'low', 'calm', 'happy', 'excited'];
      stateStrip.replaceChildren(...states.map((state) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.state = state;
        button.setAttribute('aria-pressed', String(state === activeState));
        button.setAttribute('aria-label', `${character.name} ${LeonSalV2.stateLabels[state]}`);
        const asset = character.states[state];
        if (asset) {
          const image = new Image();
          image.alt = '';
          image.decoding = 'async';
          image.loading = 'lazy';
          image.src = srcFor(character, state);
          button.append(image);
        } else {
          const missing = document.createElement('span');
          missing.className = 'missing-state-art';
          missing.textContent = '?';
          button.append(missing);
          button.dataset.missing = 'true';
        }
        const label = document.createElement('strong');
        label.textContent = stateName(state);
        button.append(label);
        button.addEventListener('click', () => {
          energy.value = { empty: 0, low: 25, calm: 50, happy: 75, excited: 100 }[state];
          render();
        });
        return button;
      }));
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
