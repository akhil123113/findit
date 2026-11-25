/* Home page: hero search, statistics, recent items, categories */
(function () {
  const CATEGORIES = [
    ['Electronics', 'laptop'],
    ['Books', 'book'],
    ['ID Cards', 'idCard'],
    ['Wallets', 'wallet'],
    ['Keys', 'key'],
    ['Bags', 'bag'],
    ['Accessories', 'watch'],
    ['Other', 'package'],
  ];

  let recentData = { lost: [], found: [] };
  let activeTab = 'lost';

  function renderCategories() {
    const grid = document.getElementById('catGrid');
    grid.innerHTML = CATEGORIES.map(
      ([name, icon]) => `
      <a class="cat-chip" href="/browse.html?category=${encodeURIComponent(name)}">
        <span class="ico">${UI.icon(icon)}</span>
        ${UI.esc(name)}
      </a>`
    ).join('');
  }

  function renderRecent() {
    const grid = document.getElementById('recentGrid');
    const items = recentData[activeTab] || [];
    if (!items.length) {
      grid.innerHTML = UI.emptyState({
        title: `No ${activeTab} items yet`,
        message:
          activeTab === 'lost'
            ? 'Nobody has reported a lost item so far. That is good news!'
            : 'No found items have been posted yet. Be the first to help someone.',
        actionHTML: `<a class="btn btn-primary" href="/report.html?type=${activeTab}">Report an item</a>`,
        icon: 'inbox',
      });
      return;
    }
    grid.innerHTML = items.map((item) => UI.itemCard(item)).join('');
  }

  async function loadRecent() {
    const grid = document.getElementById('recentGrid');
    UI.skeletonGrid(3, grid);
    try {
      recentData = await FindIt.api.get('/items/recent?limit=6');
      renderRecent();
    } catch (err) {
      grid.innerHTML = UI.emptyState({
        title: 'Could not load items',
        message: err.message,
        actionHTML: `<button class="btn btn-primary" onclick="location.reload()">Try again</button>`,
        icon: 'alertCircle',
      });
    }
  }

  async function loadStats() {
    try {
      const stats = await FindIt.api.get('/stats');
      document.querySelectorAll('[data-stat]').forEach((el) => {
        const key = el.dataset.stat;
        UI.countUp(el, Number(stats[key] || 0));
      });
    } catch (_err) {
      /* counters simply stay at zero */
    }
  }

  function wireTabs() {
    document.querySelectorAll('#recentTabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#recentTabs .tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        renderRecent();
      });
    });
  }

  function wireSearch() {
    document.getElementById('heroSearch').addEventListener('submit', (event) => {
      event.preventDefault();
      const q = document.getElementById('heroQuery').value.trim();
      const category = document.getElementById('heroCategory').value;
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      window.location.href = `/browse.html${params.toString() ? `?${params}` : ''}`;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    wireTabs();
    wireSearch();
    loadStats();
    loadRecent();
  });
})();
