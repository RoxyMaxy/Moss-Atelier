// js/main.js - Atelier Application Entrypoint

import { config } from './config.default.js';
import { Sloth } from './sloth.js';

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

  const traces = [];

  function addTraceSpan(name, attributes = {}) {
    // Privacy safeguard: never log recipient, traits, or generated text
    const cleanAttr = { ...attributes };
    delete cleanAttr.recipient;
    delete cleanAttr.traits;
    delete cleanAttr.text;

    const span = {
      name,
      timestamp: new Date().toLocaleTimeString(),
      attributes: cleanAttr
    };
    traces.push(span);
    if (traces.length > 20) traces.shift();

    if (toggleTraceBtn) {
      toggleTraceBtn.textContent = `Agent Traces (${traces.length})`;
    }

    if (traceList) {
      traceList.innerHTML = traces.map(t => 
        `<li><strong>[${t.timestamp}]</strong> ${t.name} ${JSON.stringify(t.attributes)}</li>`
      ).join('');
    }
  }

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
    addTraceSpan('retrieve.catalog', { mode, trait_count: rawTraits.length, min_budget: minBudget, max_budget: maxBudget });

    try {
      let catalogItems = [];
      let diyItems = [];

      if (useDemo) {
        const [catRes, diyRes] = await Promise.all([
          fetch('/demo/catalog.json'),
          fetch('/demo/diy-fallback.json')
        ]);
        catalogItems = await catRes.json();
        diyItems = await diyRes.json();
      } else {
        // Try server endpoint
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
            throw new Error('Server returned ' + res.status);
          }
        } catch {
          // Graceful fallback to demo files
          const catRes = await fetch('/demo/catalog.json');
          catalogItems = await catRes.json();
        }

        const diyRes = await fetch('/demo/diy-fallback.json');
        diyItems = await diyRes.json();
      }

      // Filter by Budget (with 10% tolerance)
      const allowedMax = maxBudget * 1.1;
      const validGifts = catalogItems.filter(item => {
        if (!item.price) return true;
        return item.price <= allowedMax;
      });

      addTraceSpan('rank.candidates', { total: catalogItems.length, kept: validGifts.length });

      if (validGifts.length === 0 && diyItems.length === 0) {
        showState(stateEmpty);
        sloth.setState('idle');
        return;
      }

      // Render Gifts (BUY)
      buyList.innerHTML = '';
      if (mode === 'make') {
        buySection.hidden = true;
      } else {
        buySection.hidden = false;
        validGifts.slice(0, 5).forEach((gift, index) => {
          const card = document.createElement('article');
          card.className = 'result-card';
          card.style.animationDelay = `${index * 80}ms`;
          card.innerHTML = `
            <div class="card-header">
              <h4 class="card-title">${gift.title}</h4>
              <span class="card-price">${gift.price ? `€${Number(gift.price).toFixed(2)}` : '€—'}</span>
            </div>
            <p class="card-reason">Matches ${rawTraits[0] || 'interests'} and fits the occasion.</p>
            <div class="card-tags">
              ${(gift.tags || []).map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
            </div>
          `;
          buyList.appendChild(card);
        });
      }

      // Render DIY (MAKE)
      makeList.innerHTML = '';
      if (mode === 'buy') {
        makeSection.hidden = true;
      } else {
        makeSection.hidden = false;
        diyItems.slice(0, 2).forEach((diy, index) => {
          const card = document.createElement('article');
          card.className = 'result-card diy-card';
          card.style.animationDelay = `${(index + 3) * 80}ms`;
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
                    <input type="checkbox" id="mat-${diy.id}-${mIdx}">
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
          makeList.appendChild(card);
        });
      }

      showState(stateResults);
      sloth.setState('idle');
      addTraceSpan('gift.rationale', { count: validGifts.length, diy_count: diyItems.length });

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

  resetAllBtn?.addEventListener('click', () => {
    form.reset();
    showState(stateIdle);
    traces.length = 0;
    addTraceSpan('system.reset', { cleared: true });
    alert('Atelier memory and checklists reset.');
  });

  toggleTraceBtn?.addEventListener('click', () => {
    if (tracePanel) {
      tracePanel.hidden = !tracePanel.hidden;
    }
  });

  // Initial trace log
  addTraceSpan('system.init', { mode: 'OFFLINE', shell_ready: true });
});
