/* ==========================================================================
   FindIt - shared layout: navigation bar, notification bell, footer
   ========================================================================== */

(function () {
  const S = window.FindIt.session;

  // One shared session request: every page script can `await FindIt.session.ready`
  // instead of firing its own /auth/me call (or racing against this one).
  if (!S.ready) S.ready = S.load();

  const headerHTML = () => `
    <header class="site-header">
      <div class="container nav">
        <a class="brand" href="/" aria-label="FindIt home">
          <span class="brand-mark">${UI.icon('search')}</span>
          <span>FindIt<small>Lost &amp; Found Portal</small></span>
        </a>

        <nav class="nav-links" id="navLinks" aria-label="Main navigation">
          <a href="/" data-nav="home">Home</a>
          <a href="/browse.html" data-nav="browse">Browse Items</a>
          <a href="/report.html?type=lost" data-nav="lost">Report Lost</a>
          <a href="/report.html?type=found" data-nav="found">Report Found</a>
          <a href="/contact.html" data-nav="contact">Contact</a>
          <a href="/admin.html" data-nav="admin" class="admin-only hidden">Admin</a>
        </nav>

        <div class="nav-actions">
          <div class="bell-wrap hidden" id="bellWrap">
            <button class="icon-btn" id="bellBtn" type="button" aria-label="Notifications" aria-haspopup="true">
              ${UI.icon('bell')}
              <span class="badge-dot hidden" id="bellCount">0</span>
            </button>
            <div class="dropdown hidden" id="bellMenu" role="menu">
              <div class="dropdown-head">
                <strong>Notifications</strong>
                <button class="btn-ghost btn-sm" type="button" id="readAllBtn">Mark all read</button>
              </div>
              <div id="notifList">
                <div class="small muted" style="padding:14px">Loading…</div>
              </div>
            </div>
          </div>

          <a class="btn btn-primary" href="/login.html" id="loginBtn">Log in</a>

          <div class="user-menu hidden" id="userMenu">
            <button class="user-chip" id="userChip" type="button" aria-haspopup="true">
              <span class="avatar" id="userAvatar">U</span>
              <span id="userName" class="hide-sm">Account</span>
              ${UI.icon('chevronDown', 'hide-sm')}
            </button>
            <div class="dropdown menu-list hidden" id="userDropdown" role="menu">
              <a href="/dashboard.html">${UI.icon('grid')} Dashboard</a>
              <a href="/profile.html">${UI.icon('user')} My profile</a>
              <a href="/report.html?type=lost">${UI.icon('search')} Report lost item</a>
              <a href="/report.html?type=found">${UI.icon('checkCircle')} Report found item</a>
              <a href="/admin.html" id="adminMenuLink" class="hidden">${UI.icon('shield')} Admin panel</a>
              <div class="divider"></div>
              <button type="button" id="logoutBtn" class="danger">${UI.icon('logOut')} Log out</button>
            </div>
          </div>

          <button class="icon-btn nav-toggle" id="navToggle" type="button" aria-label="Menu" aria-expanded="false">
            ${UI.icon('menu')}
          </button>
        </div>
      </div>
    </header>`;

  const footerHTML = () => `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="brand" href="/">
              <span class="brand-mark">${UI.icon('search')}</span>
              <span>FindIt<small>Lost &amp; Found Portal</small></span>
            </a>
            <p>A campus-wide lost and found platform that helps students and staff reunite with their belongings — quickly, safely and for free.</p>
            <div class="footer-social">
              <a href="/contact.html" aria-label="Email us">${UI.icon('mail')}</a>
              <a href="/browse.html" aria-label="Browse items">${UI.icon('search')}</a>
              <a href="/dashboard.html" aria-label="Dashboard">${UI.icon('grid')}</a>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="/browse.html">Browse all items</a>
            <a href="/browse.html?type=lost">Lost items</a>
            <a href="/browse.html?type=found">Found items</a>
            <a href="/browse.html?status=returned">Reunited items</a>
          </div>
          <div>
            <h4>Get started</h4>
            <a href="/report.html?type=lost">Report a lost item</a>
            <a href="/report.html?type=found">Report a found item</a>
            <a href="/register.html">Create an account</a>
            <a href="/dashboard.html">My dashboard</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="/contact.html">Contact the team</a>
            <a href="/admin.html">Administrator login</a>
            <a href="/contact.html#faq">Help &amp; FAQ</a>
            <a href="/contact.html#privacy">Privacy &amp; safety</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} FindIt — Lost &amp; Found Portal. Built for campus communities.</span>
          <span>Made with ${UI.icon('star', 'inline')} for students and staff</span>
        </div>
      </div>
    </footer>`;

  function markActiveLink() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const params = new URLSearchParams(window.location.search);
    const links = document.querySelectorAll('.nav-links a[data-nav]');
    links.forEach((link) => {
      const key = link.dataset.nav;
      let active = false;
      if (key === 'home') active = path === '/' || path === '/index.html';
      else if (key === 'browse') active = path.startsWith('/browse') || path.startsWith('/item');
      else if (key === 'lost') active = path.startsWith('/report') && params.get('type') !== 'found';
      else if (key === 'found') active = path.startsWith('/report') && params.get('type') === 'found';
      else if (key === 'contact') active = path.startsWith('/contact');
      else if (key === 'admin') active = path.startsWith('/admin');
      link.classList.toggle('active', active);
    });
  }

  function renderAuthState() {
    const user = S.user;
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const bellWrap = document.getElementById('bellWrap');
    const adminLink = document.querySelector('.nav-links a[data-nav="admin"]');
    const adminMenuLink = document.getElementById('adminMenuLink');

    if (user) {
      loginBtn.classList.add('hidden');
      userMenu.classList.remove('hidden');
      bellWrap.classList.remove('hidden');
      document.getElementById('userName').textContent = UI.firstName(user.name);
      document.getElementById('userAvatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
      if (user.role === 'admin') {
        adminLink.classList.remove('hidden');
        adminMenuLink.classList.remove('hidden');
      } else {
        adminLink.classList.add('hidden');
        adminMenuLink.classList.add('hidden');
      }
      updateBellCount(S.unread);
    } else {
      loginBtn.classList.remove('hidden');
      userMenu.classList.add('hidden');
      bellWrap.classList.add('hidden');
      adminLink.classList.add('hidden');
    }
  }

  function updateBellCount(count) {
    const badge = document.getElementById('bellCount');
    if (!badge) return;
    S.unread = count;
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : String(count);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  async function loadNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;
    list.innerHTML = '<div class="small muted" style="padding:14px">Loading…</div>';
    try {
      const data = await FindIt.api.get('/notifications');
      updateBellCount(data.unread);
      if (!data.notifications.length) {
        list.innerHTML = `<div class="small muted" style="padding:18px 14px">You have no notifications yet.</div>`;
        return;
      }
      list.innerHTML = data.notifications
        .map(
          (n) => `
        <button class="notif ${n.read ? '' : 'unread'}" type="button" data-id="${n.id}" data-link="${UI.esc(
            n.link || ''
          )}">
          <span class="notif-icon ${UI.esc(n.type || 'info')}">${UI.icon(
            n.type === 'success'
              ? 'checkCircle'
              : n.type === 'warning'
              ? 'alertTriangle'
              : n.type === 'claim'
              ? 'ticket'
              : n.type === 'contact'
              ? 'message'
              : 'info'
          )}</span>
          <span class="notif-body">
            <strong>${UI.esc(n.title)}</strong>
            <span>${UI.esc(n.message)}</span>
            <span class="muted">${UI.timeAgo(n.createdAt)}</span>
          </span>
        </button>`
        )
        .join('');

      list.querySelectorAll('.notif').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const link = btn.dataset.link;
          try {
            await FindIt.api.patch(`/notifications/${id}/read`);
            updateBellCount(Math.max(S.unread - 1, 0));
          } catch (_err) {
            /* ignore */
          }
          if (link) window.location.href = link;
        });
      });
    } catch (err) {
      list.innerHTML = `<div class="small muted" style="padding:14px">${UI.esc(err.message)}</div>`;
    }
  }

  function closeAllDropdowns(except) {
    ['bellMenu', 'userDropdown'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && el !== except) el.classList.add('hidden');
    });
  }

  function wireEvents() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.innerHTML = UI.icon(open ? 'x' : 'menu');
    });

    const bellBtn = document.getElementById('bellBtn');
    const bellMenu = document.getElementById('bellMenu');
    bellBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = bellMenu.classList.contains('hidden');
      closeAllDropdowns(willOpen ? bellMenu : null);
      bellMenu.classList.toggle('hidden', !willOpen);
      if (willOpen) loadNotifications();
    });

    const userChip = document.getElementById('userChip');
    const userDropdown = document.getElementById('userDropdown');
    userChip.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = userDropdown.classList.contains('hidden');
      closeAllDropdowns(willOpen ? userDropdown : null);
      userDropdown.classList.toggle('hidden', !willOpen);
    });

    document.getElementById('readAllBtn').addEventListener('click', async (event) => {
      event.stopPropagation();
      try {
        await FindIt.api.patch('/notifications/read-all');
        updateBellCount(0);
        loadNotifications();
        UI.toast('All notifications marked as read.', 'success');
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await S.logout();
      UI.toast('You have been logged out.', 'success', 2000);
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.bell-wrap') && !event.target.closest('.user-menu')) {
        closeAllDropdowns();
      }
    });

    window.addEventListener('findit:unauthorized', () => {
      S.user = null;
      renderAuthState();
    });
  }

  function showFlash() {
    try {
      const flash = sessionStorage.getItem('findit:flash');
      if (flash) {
        sessionStorage.removeItem('findit:flash');
        UI.toast(flash, 'info', 5000);
      }
    } catch (_err) {
      /* ignore */
    }
  }

  const Layout = {
    async init() {
      const headerSlot = document.getElementById('site-header');
      const footerSlot = document.getElementById('site-footer');
      if (headerSlot) headerSlot.outerHTML = headerHTML();
      if (footerSlot) footerSlot.outerHTML = footerHTML();

      await S.ready;
      renderAuthState();
      markActiveLink();
      wireEvents();
      showFlash();
    },
    renderAuthState,
    updateBellCount,
    markActiveLink,
  };

  window.FindIt.layout = Layout;

  document.addEventListener('DOMContentLoaded', () => {
    Layout.init();
  });
})();
