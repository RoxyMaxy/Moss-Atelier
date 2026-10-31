// js/main.js - Atelier Application Entrypoint with Local Memory and Tracing

import { config } from './config.default.js';
import { Sloth } from './sloth.js';
import { rankCandidates } from './rank.js';
import { curateDIYIdeas } from './diy.js';
import { generateGiftRationale } from './gemma.js';
import { memory } from './memory.js';
import { tracer } from './tracing.js';

// Register Service Worker for offline shell caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Sloth Companion
  const sloth = new Sloth('sloth-canvas', 'sloth-status');

  // 2. DOM Elements
  const form = document.getElementById('gift-form');
  const recipientInput = document.getElementById('recipient-name');
  const occasionSelect = document.getElementById('occasion');
  const budgetMinInput = document.getElementById('budget-min');
  const budgetMaxInput = document.getElementById('budget-max');
  const traitsInput = document.getElementById('traits-input');
  
  // States
  const stateIdle = document.getElementById('state-idle');
  const stateSearching = document.getElementById('state-searching');
  const stateResults = document.getElementById('state-results');
  const stateEmpty = document.getElementById('state-empty');
  const stateError = document.getElementById('state-error');

  const buySection = document.getElementById('buy-section');
  const makeSection = document.getElementById('make-section');
  const buyList = document.getElementById('buy-card-list');
  const makeList = document.getElementById('make-card-list');
  const memoryNotice = document.getElementById('memory-filter-notice');

  // Controls
  const raiseBudgetBtn = document.getElementById('raise-budget-btn');
  const retryBtn = document.getElementById('retry-btn');
  const loadDemoBtn = document.getElementById('load-demo-btn');
  const resetAllBtn = document.getElementById('reset-all-btn');
  const toggleTraceBtn = document.getElementById('toggle-trace-btn');
  const tracePanel = document.getElementById('trace-panel');
  const traceList = document.getElementById('trace-list');

  // Connect tracer to UI panel
  tracer.onSpan((spans) => {
    if (toggleTraceBtn) {
      toggleTraceBtn.textContent = `Agent Traces (${spans.length})`;
    }
    if (traceList) {
      traceList.innerHTML = spans.map(t => 
        `<li><strong>[${t.timestamp}]</strong> ${t.name} ${JSON.stringify(t.attributes)}</li>`
      ).join('');
    }
  });

  function showState(activeStateEl) {
    [stateIdle, stateSearching, stateResults, stateEmpty, stateError].forEach(el => {
      if (el) el.hidden = (el !== activeStateEl);
    });
  }

  // 3. Search & Curation Flow
  async function performCuration(useDemo = false) {
    const recipient = (recipientInput.value || 'Friend').trim();
    const occasion = occasionSelect.value;
    const minBudget = Number(budgetMinInput.value) || 0;
    const maxBudget = Number(budgetMaxInput.value) || 100;
    const rawTraits = traitsInput.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 3);
    const mode = form.elements['searchMode'].value;

    showState(stateSearching);
    sloth.setState('searching');

    tracer.recordSpan('retrieve.catalog', {
      mode,
      trait_count: rawTraits.length,
      min_budget: minBudget,
      max_budget: maxBudget
    });

    try {
      let catalogItems = [];
      let fallbackDIY = [];

      // Always load fallback DIY
      try {
        const fbRes = await fetch('/demo/diy-fallback.json');
        fallbackDIY = await fbRes.json();
      } catch {
        // Quiet
      }

      if (useDemo) {
        const catRes = await fetch('/demo/catalog.json');
        catalogItems = await catRes.json();
      } else {
        try {
          const res = await fetch('/api/retrieve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ occasion, traits: rawTraits, minBudget, maxBudget })
          });
          if (res.ok) {
            const data = await res.json();
            catalogItems = data.candidates || [];
          } else {
            throw new Error('API status ' + res.status);
          }
        } catch {
          // Fallback to local catalog
          const catRes = await fetch('/demo/catalog.json');
          catalogItems = await catRes.json();
        }
      }

      // Step A: Separate gift items from DIY items in catalog
      const candidateGifts = catalogItems.filter(item => item.kind === 'gift');
      const candidateDIY = catalogItems.filter(item => item.kind === 'diy');

      // Step B: Filter gifts against local gift history for THIS recipient
      const memoryResult = await memory.filterGiftsByHistory(candidateGifts, recipient);
      const eligibleGifts = memoryResult.kept;

      if (memoryNotice) {
        if (memoryResult.removedCount > 0) {
          memoryNotice.hidden = false;
          memoryNotice.textContent = `Excluded ${memoryResult.removedCount} gift${memoryResult.removedCount > 1 ? 's' : ''} already given to ${recipient}`;
        } else {
          memoryNotice.hidden = true;
        }
      }

      // Step C: Deterministic ranking of gifts
      const rankedGifts = rankCandidates(eligibleGifts, {
        traits: rawTraits,
        occasion,
        minBudget,
        maxBudget
      });

      tracer.recordSpan('rank.candidates', {
        input_count: candidateGifts.length,
        filtered_by_history: memoryResult.removedCount,
        ranked_count: rankedGifts.length
      });

      // Step D: Curate DIY ideas (2 ideas)
      const curatedDIY = curateDIYIdeas(candidateDIY, fallbackDIY);
      tracer.recordSpan('diy.plan', {
        count: curatedDIY.length
      });

      // Check empty state
      if (rankedGifts.length === 0 && curatedDIY.length === 0) {
        showState(stateEmpty);
        sloth.setState('idle');
        return;
      }

      // Step E: Generate / ground rationale
      const groundedPicks = await generateGiftRationale(rankedGifts, {
        traits: rawTraits,
        occasion
      });

      tracer.recordSpan('gift.rationale', {
        grounded_count: groundedPicks.length
      });

      // Render BUY list
      buyList.innerHTML = '';
      if (mode === 'make') {
        buySection.hidden = true;
      } else {
        buySection.hidden = false;
        groundedPicks.forEach((gift, index) => {
          const card = document.createElement('article');
          card.className = 'result-card';
          card.style.animationDelay = `${index * 80}ms`;
          card.innerHTML = `
            <div class="card-header">
              <h4 class="card-title">${gift.title}</h4>
              <span class="card-price">${gift.price ? `€${Number(gift.price).toFixed(2)}` : '€—'}</span>
            </div>
            <p class="card-reason">${gift.why}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <div class="card-tags">
                ${(gift.tags || []).map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
              </div>
              <button class="btn-secondary mark-given-btn" style="font-size: 11px; padding: 4px 8px;" data-title="${gift.title}">
                Mark Given
              </button>
            </div>
          `;

          // Handle marking gift as given
          const markBtn = card.querySelector('.mark-given-btn');
          markBtn.addEventListener('click', async () => {
            await memory.recordGiftGiven(recipient, gift.title);
            card.style.opacity = '0.5';
            markBtn.disabled = true;
            markBtn.textContent = 'Saved to History ✓';
          });

          buyList.appendChild(card);
        });
      }

      // Render MAKE list (with persistent checklists)
      makeList.innerHTML = '';
      if (mode === 'buy') {
        makeSection.hidden = true;
      } else {
        makeSection.hidden = false;
        for (let i = 0; i < curatedDIY.length; i++) {
          const diy = curatedDIY[i];
          const savedChecks = await memory.getChecklistState(diy.id);

          const card = document.createElement('article');
          card.className = 'result-card diy-card';
          card.style.animationDelay = `${(i + 3) * 80}ms`;
          card.innerHTML = `
            <div class="card-header">
              <h4 class="card-title">${diy.title}</h4>
              <span class="card-price" style="color: var(--accent2);">${diy.minutes}m • Diff ${diy.difficulty}/3</span>
            </div>
            <div style="margin-top: 8px;">
              <strong style="font-size: var(--text-xs); color: var(--text);">Materials Checklist:</strong>
              <ul class="checklist">
                ${(diy.materials || []).map((m, mIdx) => `
                  <li class="checklist-item">
                    <input type="checkbox" id="mat-${diy.id}-${mIdx}" data-index="${mIdx}" ${savedChecks.includes(mIdx) ? 'checked' : ''}>
                    <label for="mat-${diy.id}-${mIdx}">${m.name} (${m.qty})</label>
                  </li>
                `).join('')}
              </ul>
            </div>
            <div style="margin-top: 8px;">
              <strong style="font-size: var(--text-xs); color: var(--text);">Steps:</strong>
              <ol style="padding-left: 20px; font-size: var(--text-sm); color: var(--muted); margin-top: 4px;">
                ${(diy.steps || []).map(s => `<li style="margin-bottom: 4px;">${s.text}</li>`).join('')}
              </ol>
            </div>
            ${diy.safety ? `<div class="safety-line">⚠ ${diy.safety}</div>` : ''}
          `;

          // Bind checklist state persistence
          const checkboxes = card.querySelectorAll('input[type="checkbox"]');
          checkboxes.forEach(cb => {
            cb.addEventListener('change', async () => {
              const active = [];
              checkboxes.forEach(box => {
                if (box.checked) active.push(Number(box.dataset.index));
              });
              await memory.saveChecklistState(diy.id, active);
            });
          });

          makeList.appendChild(card);
        }
      }

      showState(stateResults);
      sloth.setState('idle');

    } catch (err) {
      console.error(err);
      showState(stateError);
      sloth.setState('idle');
    }
  }

  // Event Listeners
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    performCuration(false);
  });

  raiseBudgetBtn?.addEventListener('click', () => {
    const current = Number(budgetMaxInput.value) || 50;
    budgetMaxInput.value = Math.round(current * 1.2);
    performCuration(false);
  });

  retryBtn?.addEventListener('click', () => performCuration(false));
  loadDemoBtn?.addEventListener('click', () => performCuration(true));

  resetAllBtn?.addEventListener('click', async () => {
    await memory.resetAll();
    form.reset();
    showState(stateIdle);
    tracer.recordSpan('system.reset', { cleared: true });
    alert('Moss Atelier local history and checklist progress have been reset.');
  });

  toggleTraceBtn?.addEventListener('click', () => {
    if (tracePanel) {
      tracePanel.hidden = !tracePanel.hidden;
    }
  });

  // Initial trace log
  tracer.recordSpan('system.init', { mode: 'OFFLINE', shell_ready: true });
});
