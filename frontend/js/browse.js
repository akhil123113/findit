/* Browse page: filters, search, pagination — all state lives in the URL */
(function () {
  const form = document.getElementById('filterForm');
  const grid = document.getElementById('resultsGrid');
  const countEl = document.getElementById('resultCount');
  const subEl = document.getElementById('resultSub');
  const activeWrap = document.getElementById('activeFilters');
  const paginationSlot = document.getElementById('paginationSlot');

  const state = {
    q: '',
    category: '',
    type: '',
    location: '',
    from: '',
    to: '',
    sort: 'newest',
    page: 1,
  };

  const FIELD_LABELS = {
    q: 'Keyword',
    category: 'Category',
    type: 'Status',
    location: 'Location',
    from: 'From',
    to: 'To',
  };

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    ['q', 'category', 'type', 'location', 'from', 'to', 'sort'].forEach((key) => {
      state[key] = params.get(key) || '';
    });
    state.page = Math.max(Number(params.get('page')) || 1, 1);
    if (!state.sort) state.sort = 'newest';
  }

  function writeUrl() {
    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (!value || (key === 'sort' && value === 'newest') || (key === 'page' && value === 1)) return;
      params.set(key, value);
    });
    const url = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, '', url);
  }

  function syncForm() {
    document.getElementById('fSearch').value = state.q;
    document.getElementById('fCategory').value = state.category;
    document.getElementById('fLocation').value = state.location;
    document.getElementById('fFrom').value = state.from;
    document.getElementById('fTo').value = state.to;
    document.getElementById('fSort').value = state.sort;
    document.querySelectorAll('#typeChips .chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.type === state.type);
    });
  }

  function renderActiveFilters() {
    const keys = ['q', 'category', 'type', 'location', 'from', 'to'].filter((key) => state[key]);
    if (!keys.length) {
      activeWrap.innerHTML = '';
      return;
    }
    activeWrap.innerHTML = keys
      .map(
        (key) => `
        <span class="filter-pill">
          ${UI.esc(FIELD_LABELS[key])}: ${UI.esc(state[key])}
          <button type="button" data-clear="${key}" aria-label="Remove filter">${UI.icon('x')}</button>
        </span>`
      )
      .join('');
    activeWrap.querySelectorAll('[data-clear]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state[btn.dataset.clear] = '';
        state.page = 1;
        syncForm();
        load();
      });
    });
  }

  async function load() {
    UI.skeletonGrid(6, grid);
    countEl.textContent = 'Loading…';
    subEl.textContent = '';
    paginationSlot.innerHTML = '';
    renderActiveFilters();
    writeUrl();

    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set('limit', '12');

    try {
      const data = await FindIt.api.get(`/items?${params}`);
      const total = data.total;
      countEl.textContent = `${total} item${total === 1 ? '' : 's'} found`;
      subEl.textContent = data.pages > 1 ? ` · page ${data.page} of ${data.pages}` : '';

      if (!total) {
        grid.innerHTML = UI.emptyState({
          title: 'No items match these filters',
          message: 'Try a different keyword, widen the date range or clear the filters.',
          actionHTML: `<button class="btn btn-outline" type="button" id="emptyClear">Clear filters</button>`,
          icon: 'search',
        });
        const emptyClear = document.getElementById('emptyClear');
        if (emptyClear) emptyClear.addEventListener('click', clearAll);
        return;
      }

      grid.innerHTML = data.items.map((item) => UI.itemCard(item)).join('');
      if (data.pages > 1) {
        paginationSlot.innerHTML = '';
        paginationSlot.appendChild(
          UI.pagination({
            page: data.page,
            pages: data.pages,
            onGo: (page) => {
              state.page = page;
              load();
              window.scrollTo({ top: 220, behavior: 'smooth' });
            },
          })
        );
      }
    } catch (err) {
      grid.innerHTML = UI.emptyState({
        title: 'Could not load items',
        message: err.message,
        icon: 'alertCircle',
      });
      countEl.textContent = 'Error';
    }
  }

  function clearAll() {
    state.q = '';
    state.category = '';
    state.type = '';
    state.location = '';
    state.from = '';
    state.to = '';
    state.sort = 'newest';
    state.page = 1;
    syncForm();
    load();
  }

  function wire() {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      state.q = document.getElementById('fSearch').value.trim();
      state.category = document.getElementById('fCategory').value;
      state.location = document.getElementById('fLocation').value.trim();
      state.from = document.getElementById('fFrom').value;
      state.to = document.getElementById('fTo').value;
      state.sort = document.getElementById('fSort').value;
      state.page = 1;
      load();
    });

    document.querySelectorAll('#typeChips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.type = chip.dataset.type;
        state.page = 1;
        syncForm();
        load();
      });
    });

    document.getElementById('fSort').addEventListener('change', () => {
      state.sort = document.getElementById('fSort').value;
      state.page = 1;
      load();
    });

    document.getElementById('fSearch').addEventListener(
      'input',
      UI.debounce((event) => {
        state.q = event.target.value.trim();
        state.page = 1;
        load();
      }, 420)
    );

    document.getElementById('clearFilters').addEventListener('click', clearAll);
  }

  document.addEventListener('DOMContentLoaded', () => {
    readUrl();
    syncForm();
    wire();
    load();
  });
})();
