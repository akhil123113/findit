/* ==========================================================================
   FindIt - shared UI kit: icons, cards, toasts, modals, formatting
   ========================================================================== */

const UI = {};

/* --------------------------------- icons ---------------------------------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  mapPin: '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  tag: '<path d="M20.6 13.4L13.4 20.6a2 2 0 01-2.8 0l-7.2-7.2A2 2 0 013 12V5a2 2 0 012-2h7a2 2 0 011.4.6l7.2 7.2a2 2 0 010 2.6z"/><circle cx="8" cy="8" r="1.4"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.1A9.9 9.9 0 0112 6c6.4 0 10 6 10 6a17 17 0 01-3 3.6M6.5 7.7A16.7 16.7 0 002 12s3.6 6.5 10 6.5c1.2 0 2.3-.2 3.3-.6"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/>',
  mail: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',
  phone: '<path d="M6.6 3h3l1.5 4-2 1.4a12 12 0 006.5 6.5l1.4-2 4 1.5v3a2 2 0 01-2.2 2A17 17 0 014.6 5.2 2 2 0 016.6 3z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 21a6.5 6.5 0 0113 0"/><path d="M16 5.5a3.5 3.5 0 010 6.6M18 21a6.4 6.4 0 00-2-4.6"/>',
  bell: '<path d="M18 9a6 6 0 10-12 0c0 5-2 6-2 6h16s-2-1-2-6z"/><path d="M10.3 20a2 2 0 003.4 0"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevronRight: '<path d="M9 5l7 7-7 7"/>',
  chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.5 9"/>',
  alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.2v.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.1"/>',
  alertTriangle: '<path d="M12 3.5l9 16H3l9-16z"/><path d="M12 9v4.5M12 16.5v.1"/>',
  trash: '<path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/><path d="M10 11v6M14 11v6"/>',
  edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z"/><path d="M14.5 5.5l4 4"/>',
  upload: '<path d="M12 16V4"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M4 16v2.5A2.5 2.5 0 006.5 21h11A2.5 2.5 0 0020 18.5V16"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l4.5-4.5 3.5 3.5 3-3L20 17"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.2"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19h20"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 016.5 2H20v18H6.5A2.5 2.5 0 004 22V4.5z"/><path d="M20 16H6.5A2.5 2.5 0 004 18.5"/>',
  idCard: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16.5c.6-1.6 1.7-2.3 3-2.3s2.4.7 3 2.3M14.5 10h4M14.5 13.5h3"/>',
  wallet: '<rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M2.5 10h19"/><circle cx="17" cy="14.5" r="1.3"/>',
  key: '<circle cx="8" cy="8" r="4"/><path d="M11 11l9 9M17 17l2-2M14.5 14.5l2-2"/>',
  bag: '<path d="M6 8h12l1.5 12H4.5L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
  watch: '<circle cx="12" cy="12" r="6"/><path d="M12 9.5V12l1.8 1.2"/><path d="M9 3h6M9 21h6"/>',
  package: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M18.5 16.5l.9 2.2 2.1.8-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.8.9-2.2z"/>',
  arrowRight: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  logOut: '<path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h10l-1.5 3.5L15 11H5"/>',
  refresh: '<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 5v6h-6"/>',
  message: '<path d="M21 12a8.5 8.5 0 01-8.5 8.5H8L3 21l1.3-4.2A8.5 8.5 0 1121 12z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  lock: '<rect x="4.5" y="10" width="15" height="11" rx="3"/><path d="M8 10V7a4 4 0 018 0v3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M8.5 11h5M11 8.5v5"/>',
  send: '<path d="M21 3L3 10.5l7 2.5 2.5 7L21 3z"/><path d="M10 13l4.5-4.5"/>',
  inbox: '<path d="M3 12h5l1.5 3h5L16 12h5"/><path d="M5 5h14l2 7v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5l2-7z"/>',
  fileText: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5z"/>',
  gift: '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3 13h18M12 9v11"/><path d="M12 9S10.5 4 8 4a2.5 2.5 0 000 5h4zm0 0s1.5-5 4-5a2.5 2.5 0 010 5h-4z"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7.5 10.5V17M7.5 7.6v.1M11.5 17v-3.6a2.4 2.4 0 014.8 0V17"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1"/>',
  xSocial: '<path d="M4 4l16 16M20 4L4 20"/>',
  checkCheck: '<path d="M2 13l4 4L16 7"/><path d="M11 15l2 2L22 8"/>',
  ticket: '<path d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2a3 3 0 000 6v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a3 3 0 000-6z"/><path d="M12 7v10"/>',
};

UI.icon = function icon(name, cls = '') {
  const body = ICONS[name] || ICONS.info;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
};

/* ------------------------------- formatting ------------------------------- */
UI.esc = function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

UI.formatDate = function formatDate(iso, withTime = false) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const opts = { day: '2-digit', month: 'short', year: 'numeric' };
  if (withTime) {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
  }
  return date.toLocaleDateString('en-IN', opts);
};

UI.timeAgo = function timeAgo(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return '';
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return UI.formatDate(iso);
};

UI.todayISO = function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

/* -------------------------------- badges --------------------------------- */
UI.typeBadge = function typeBadge(type) {
  const isLost = type === 'lost';
  return `<span class="badge ${isLost ? 'badge-lost' : 'badge-found'}">${UI.icon(
    isLost ? 'search' : 'checkCircle'
  )}${isLost ? 'Lost' : 'Found'}</span>`;
};

UI.statusBadge = function statusBadge(status) {
  const map = {
    active: ['badge-found', 'Active'],
    returned: ['badge-returned', 'Returned'],
    pending: ['badge-pending', 'Pending review'],
    rejected: ['badge-rejected', 'Rejected'],
    removed: ['badge-rejected', 'Removed'],
    accepted: ['badge-found', 'Accepted'],
  };
  const [cls, label] = map[status] || ['badge-pending', status || 'Unknown'];
  return `<span class="badge ${cls}">${label}</span>`;
};

UI.categoryIcon = function categoryIcon(category) {
  const map = {
    Electronics: 'laptop',
    Books: 'book',
    'ID Cards': 'idCard',
    Wallets: 'wallet',
    Keys: 'key',
    Bags: 'bag',
    Accessories: 'watch',
    Other: 'package',
  };
  return map[category] || 'package';
};

UI.CATEGORIES = [
  'Electronics',
  'Books',
  'ID Cards',
  'Wallets',
  'Keys',
  'Bags',
  'Accessories',
  'Other',
];

/* ------------------------------- item card -------------------------------- */
UI.itemCard = function itemCard(item) {
  const media = item.imageUrl
    ? `<img src="${UI.esc(item.imageUrl)}" alt="${UI.esc(item.title)}" loading="lazy" />`
    : `<div class="no-image">${UI.icon(UI.categoryIcon(item.category))}</div>`;

  const badges = [
    UI.typeBadge(item.type),
    item.status === 'returned' ? UI.statusBadge('returned') : '',
    item.status === 'pending' ? UI.statusBadge('pending') : '',
  ]
    .filter(Boolean)
    .join('');

  return `
    <article class="card item-card card-hover">
      <a class="cover-link" href="/item.html?id=${encodeURIComponent(item.id)}" aria-label="${UI.esc(
        item.title
      )}"></a>
      <div class="item-media">
        ${media}
        <div class="media-badges">${badges}</div>
      </div>
      <div class="item-body">
        <span class="item-cat">${UI.esc(item.category)}</span>
        <h3 class="item-title">${UI.esc(item.title)}</h3>
        <div class="item-meta">
          <span>${UI.icon('mapPin')}<span class="ellipsis">${UI.esc(item.location)}</span></span>
          <span>${UI.icon('calendar')}<span class="ellipsis">${
            item.type === 'lost' ? 'Lost on' : 'Found on'
          } ${UI.formatDate(item.dateLostFound)}</span></span>
        </div>
      </div>
      <div class="item-foot">
        <span>${UI.icon('eye', 'inline')} ${item.views || 0} views</span>
        <span>${UI.timeAgo(item.createdAt)}</span>
      </div>
    </article>`;
};

UI.emptyState = function emptyState({ title, message, actionHTML = '', icon = 'inbox' }) {
  return `
    <div class="empty">
      <div class="ico">${UI.icon(icon)}</div>
      <h3>${UI.esc(title)}</h3>
      <p>${UI.esc(message || '')}</p>
      ${actionHTML}
    </div>`;
};

UI.skeletonGrid = function skeletonGrid(count = 6, container) {
  const html = Array.from({ length: count }, () => '<div class="skeleton"></div>').join('');
  if (container) container.innerHTML = html;
  return html;
};

/* --------------------------------- toasts -------------------------------- */
UI.toast = function toast(message, type = 'info', timeout = 4200) {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const iconName =
    type === 'success' ? 'checkCircle' : type === 'error' ? 'alertCircle' : type === 'warning' ? 'alertTriangle' : 'info';
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${UI.icon(iconName)}<div>${UI.esc(message)}</div>`;
  stack.appendChild(el);

  const remove = () => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 220);
  };
  const timer = setTimeout(remove, timeout);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
  return el;
};

/* --------------------------------- alerts -------------------------------- */
UI.showAlert = function showAlert(target, message, type = 'error') {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const iconName =
    type === 'success' ? 'checkCircle' : type === 'warning' ? 'alertTriangle' : type === 'info' ? 'info' : 'alertCircle';
  el.className = `alert alert-${type}`;
  el.innerHTML = `${UI.icon(iconName)}<div>${UI.esc(message)}</div>`;
  el.classList.remove('hidden');
};

UI.clearAlert = function clearAlert(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  el.className = 'alert hidden';
  el.innerHTML = '';
};

/* --------------------------------- modal --------------------------------- */
UI.modal = function modal({ title, subtitle = '', body = '', footer = '', size = '' }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" style="${size === 'lg' ? 'max-width:720px' : ''}" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div>
          <h3>${UI.esc(title)}</h3>
          ${subtitle ? `<p>${UI.esc(subtitle)}</p>` : ''}
        </div>
        <button class="modal-close" type="button" aria-label="Close">${UI.icon('x')}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
    </div>`;

  const close = () => {
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.querySelector('.modal-close').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(backdrop);

  return { element: backdrop, close };
};

UI.confirm = function confirm({
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    const dialog = UI.modal({
      title,
      body: `<p style="margin:0;color:var(--text-soft)">${UI.esc(message)}</p>`,
      footer: `
        <button class="btn btn-outline" data-act="cancel" type="button">${UI.esc(cancelText)}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok" type="button">${UI.esc(
        confirmText
      )}</button>`,
    });
    dialog.element.querySelector('[data-act="cancel"]').addEventListener('click', () => {
      dialog.close();
      resolve(false);
    });
    dialog.element.querySelector('[data-act="ok"]').addEventListener('click', () => {
      dialog.close();
      resolve(true);
    });
  });
};

UI.lightbox = function lightbox(src, alt = '') {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = `<img src="${UI.esc(src)}" alt="${UI.esc(alt)}" />`;
  const close = () => box.remove();
  box.addEventListener('click', close);
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') close();
    },
    { once: true }
  );
  document.body.appendChild(box);
};

/* -------------------------------- helpers -------------------------------- */
UI.debounce = function debounce(fn, wait = 350) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

UI.qs = function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
};

UI.setLoading = function setLoading(button, loading, loadingText = 'Please wait…') {
  if (!button) return;
  if (loading) {
    button.dataset.label = button.innerHTML;
    button.classList.add('is-loading');
    button.disabled = true;
    if (loadingText) button.textContent = loadingText;
  } else {
    button.classList.remove('is-loading');
    button.disabled = false;
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
};

UI.fieldError = function fieldError(input, message) {
  const group = input.closest('.form-group');
  if (!group) return;
  let el = group.querySelector('.field-error');
  if (!el) {
    el = document.createElement('div');
    el.className = 'field-error';
    group.appendChild(el);
  }
  if (message) {
    group.classList.add('has-error');
    el.textContent = message;
  } else {
    group.classList.remove('has-error');
    el.textContent = '';
  }
};

UI.clearFormErrors = function clearFormErrors(form) {
  form.querySelectorAll('.form-group.has-error').forEach((group) => {
    group.classList.remove('has-error');
  });
  form.querySelectorAll('.field-error').forEach((el) => {
    el.textContent = '';
  });
};

/** "Dr. Meera Rao" -> "Meera", "Akhil Pudota" -> "Akhil" */
UI.firstName = function firstName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'there';
  const titles = ['dr.', 'dr', 'prof.', 'prof', 'mr.', 'mr', 'ms.', 'ms', 'mrs.', 'mrs', 'er.'];
  if (parts.length > 1 && titles.includes(parts[0].toLowerCase())) return parts[1];
  return parts[0];
};

UI.isEmail = (value) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(value || '').trim());

UI.countUp = function countUp(el, target, suffix = '') {
  const duration = 900;
  const start = performance.now();
  const from = 0;
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${Math.round(from + (target - from) * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

/** Image preview for upload inputs. */
UI.bindImagePreview = function bindImagePreview(input, previewWrap) {
  if (!input || !previewWrap) return;
  const render = (file) => {
    if (!file) {
      previewWrap.innerHTML = '';
      previewWrap.classList.add('hidden');
      return;
    }
    if (!file.type.startsWith('image/')) {
      UI.toast('Please choose an image file (JPG, PNG or WEBP).', 'error');
      input.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    previewWrap.classList.remove('hidden');
    previewWrap.innerHTML = `
      <img src="${url}" alt="Preview" />
      <button type="button" class="remove-img" aria-label="Remove image">${UI.icon('x')}</button>`;
    previewWrap.querySelector('.remove-img').addEventListener('click', () => {
      input.value = '';
      render(null);
    });
  };

  input.addEventListener('change', () => render(input.files[0]));

  const box = input.closest('.upload-box');
  if (box) {
    ['dragenter', 'dragover'].forEach((evt) =>
      box.addEventListener(evt, (event) => {
        event.preventDefault();
        box.classList.add('dragover');
      })
    );
    ['dragleave', 'drop'].forEach((evt) =>
      box.addEventListener(evt, (event) => {
        event.preventDefault();
        box.classList.remove('dragover');
      })
    );
    box.addEventListener('drop', (event) => {
      const file = event.dataTransfer.files[0];
      if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        render(file);
      }
    });
  }
};

UI.pagination = function pagination({ page, pages, onGo }) {
  const wrap = document.createElement('div');
  wrap.className = 'pagination';
  if (pages <= 1) return wrap;

  const add = (label, targetPage, { disabled = false, active = false } = {}) => {
    const btn = document.createElement('button');
    btn.className = `page-btn${active ? ' active' : ''}`;
    btn.type = 'button';
    btn.innerHTML = label;
    btn.disabled = disabled;
    btn.addEventListener('click', () => onGo(targetPage));
    wrap.appendChild(btn);
  };

  add(UI.icon('chevronLeft'), page - 1, { disabled: page <= 1 });

  const windowSize = 2;
  const start = Math.max(1, page - windowSize);
  const end = Math.min(pages, page + windowSize);
  if (start > 1) add('1', 1);
  if (start > 2) {
    const dots = document.createElement('span');
    dots.className = 'muted';
    dots.textContent = '…';
    wrap.appendChild(dots);
  }
  for (let i = start; i <= end; i += 1) add(String(i), i, { active: i === page });
  if (end < pages - 1) {
    const dots = document.createElement('span');
    dots.className = 'muted';
    dots.textContent = '…';
    wrap.appendChild(dots);
  }
  if (end < pages) add(String(pages), pages);

  add(UI.icon('chevronRight'), page + 1, { disabled: page >= pages });
  return wrap;
};

window.UI = UI;
