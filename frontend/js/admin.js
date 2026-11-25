/* Admin dashboard: moderation, users, claims, flags, messages */
(function () {
  const state = { items: [], users: [], claims: [], reports: [], messages: [], stats: {}, status: '', q: '' };

  /* -------------------------------- helpers -------------------------------- */
  function table(headers, rows) {
    if (!rows.length) return UI.emptyState({ title: 'Nothing here', message: 'No records match this view.', icon: 'inbox' });
    return `
      <div class="table-wrap"><div class="table-scroll">
        <table class="data">
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      </div></div>`;
  }

  /* -------------------------------- overview ------------------------------- */
  function renderStats() {
    const s = state.stats;
    const cards = [
      [s.items || 0, 'Total reports'],
      [s.active || 0, 'Active listings'],
      [s.returned || 0, 'Returned items'],
      [s.users || 0, 'Registered users'],
      [s.openClaims || 0, 'Pending claims'],
      [s.openReports || 0, 'Open flags'],
      [s.newMessages || 0, 'New messages'],
      [`${s.successRate || 0}%`, 'Success rate'],
    ];
    document.getElementById('adminStats').innerHTML = cards
      .map(([value, label]) => `<div class="mini-stat"><strong>${value}</strong><span>${label}</span></div>`)
      .join('');

    const attention = [];
    if (s.pending) attention.push(['Approval queue', `${s.pending} report(s) waiting`, 'pending']);
    if (s.openClaims) attention.push(['Claim requests', `${s.openClaims} awaiting a decision`, 'claims']);
    if (s.openReports) attention.push(['Flagged listings', `${s.openReports} open flag(s)`, 'reports']);
    if (s.newMessages) attention.push(['Contact messages', `${s.newMessages} unread`, 'messages']);
    if (s.blocked) attention.push(['Blocked accounts', `${s.blocked} user(s) blocked`, 'users']);

    document.getElementById('attentionList').innerHTML = attention.length
      ? attention
          .map(
            ([title, sub, panel]) => `
        <button class="list-row" type="button" data-goto="${panel}" style="width:100%;text-align:left;background:transparent;font:inherit;cursor:pointer">
          <div class="list-main"><strong>${title}</strong><div class="sub">${sub}</div></div>
          <div class="list-actions"><span class="btn btn-outline btn-sm">Open</span></div>
        </button>`
          )
          .join('')
      : `<div class="small muted">All clear — nothing needs moderation right now.</div>`;

    document.querySelectorAll('#attentionList [data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => showPanel(btn.dataset.goto));
    });
  }

  /* --------------------------------- items --------------------------------- */
  function itemActions(item) {
    const actions = [`<a class="btn btn-outline btn-sm" href="/item.html?id=${item.id}">View</a>`];
    if (item.status !== 'active') actions.push(`<button class="btn btn-success btn-sm" type="button" data-status-set="active" data-id="${item.id}">Approve</button>`);
    if (item.status === 'pending') actions.push(`<button class="btn btn-outline btn-sm" type="button" data-status-set="rejected" data-id="${item.id}">Reject</button>`);
    if (item.status === 'active') actions.push(`<button class="btn btn-outline btn-sm" type="button" data-status-set="removed" data-id="${item.id}">Remove</button>`);
    actions.push(`<button class="btn btn-outline btn-sm" type="button" data-item-delete="${item.id}">Delete</button>`);
    return actions.join('');
  }

  function renderItems() {
    const rows = state.items.map(
      (item) => `
      <tr>
        <td style="width:64px">
          ${
            item.imageUrl
              ? `<img src="${UI.esc(item.imageUrl)}" alt="" style="width:44px;height:44px;border-radius:10px;object-fit:cover" />`
              : `<div class="list-thumb" style="width:44px;height:44px">${UI.icon(UI.categoryIcon(item.category))}</div>`
          }
        </td>
        <td>
          <strong>${UI.esc(item.title)}</strong>
          <div class="small muted">${UI.esc(item.category)} · ${UI.esc(item.location)}</div>
        </td>
        <td>${UI.typeBadge(item.type)}</td>
        <td>${UI.esc(item.ownerName || '—')}</td>
        <td>${UI.statusBadge(item.status)}</td>
        <td class="small muted">${UI.formatDate(item.createdAt)}</td>
        <td><div class="list-actions">${itemActions(item)}</div></td>
      </tr>`
    );

    const wrap = document.getElementById('adminItems');
    wrap.innerHTML = table(['', 'Item', 'Type', 'Reported by', 'Status', 'Submitted', 'Actions'], rows);
    wireItemActions(wrap);
  }

  function renderPending() {
    const pending = state.items.filter((item) => item.status === 'pending');
    const wrap = document.getElementById('pendingItems');
    if (!pending.length) {
      wrap.innerHTML = UI.emptyState({
        title: 'Approval queue is empty',
        message: 'New reports appear here when AUTO_APPROVE_ITEMS=false in the .env file.',
        icon: 'checkCircle',
      });
      return;
    }
    wrap.innerHTML = pending
      .map(
        (item) => `
      <div class="list-row">
        <div class="list-thumb">${item.imageUrl ? `<img src="${UI.esc(item.imageUrl)}" alt="" />` : UI.icon(UI.categoryIcon(item.category))}</div>
        <div class="list-main">
          <strong>${UI.esc(item.title)}</strong>
          <div class="sub">
            ${UI.typeBadge(item.type)}
            <span>${UI.esc(item.category)}</span>
            <span>${UI.esc(item.location)}</span>
            <span>by ${UI.esc(item.ownerName || '—')}</span>
            <span>${UI.timeAgo(item.createdAt)}</span>
          </div>
        </div>
        <div class="list-actions">
          <a class="btn btn-outline btn-sm" href="/item.html?id=${item.id}">View</a>
          <button class="btn btn-success btn-sm" type="button" data-status-set="active" data-id="${item.id}">Approve</button>
          <button class="btn btn-danger btn-sm" type="button" data-status-set="rejected" data-id="${item.id}">Reject</button>
        </div>
      </div>`
      )
      .join('');
    wireItemActions(wrap);
  }

  function wireItemActions(scope) {
    scope.querySelectorAll('[data-status-set]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const status = btn.dataset.statusSet;
        const labels = { active: 'approve', rejected: 'reject', removed: 'remove', returned: 'mark as returned' };
        const ok = await UI.confirm({
          title: `${labels[status] || 'Update'} this report?`,
          message: 'The owner will be notified about this decision.',
          confirmText: labels[status] ? labels[status][0].toUpperCase() + labels[status].slice(1) : 'Update',
          danger: status === 'rejected' || status === 'removed',
        });
        if (!ok) return;
        try {
          await FindIt.api.patch(`/admin/items/${btn.dataset.id}/status`, { status });
          UI.toast(`Item ${status}.`, 'success');
          loadItems();
          loadStats();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });

    scope.querySelectorAll('[data-item-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await UI.confirm({
          title: 'Delete this listing permanently?',
          message: 'The report, its claims and flags will be removed. This cannot be undone.',
          confirmText: 'Delete',
          danger: true,
        });
        if (!ok) return;
        try {
          await FindIt.api.del(`/admin/items/${btn.dataset.itemDelete}`);
          UI.toast('Listing deleted.', 'success');
          loadItems();
          loadStats();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  /* --------------------------------- users --------------------------------- */
  function renderUsers() {
    const rows = state.users.map(
      (user) => `
      <tr>
        <td><strong>${UI.esc(user.name)}</strong><div class="small muted">${UI.esc(user.email)}</div></td>
        <td>${UI.esc(user.studentId || '—')}<div class="small muted">${UI.esc(user.department || '')}</div></td>
        <td><span class="badge">${UI.esc(user.role)}</span></td>
        <td>${user.status === 'active' ? '<span class="badge badge-found">Active</span>' : '<span class="badge badge-lost">Blocked</span>'}</td>
        <td>${user.reports}</td>
        <td class="small muted">${UI.formatDate(user.createdAt)}</td>
        <td>
          <div class="list-actions">
            ${
              user.status === 'active'
                ? `<button class="btn btn-outline btn-sm" type="button" data-user-block="${user.id}" data-status="blocked">Block</button>`
                : `<button class="btn btn-success btn-sm" type="button" data-user-block="${user.id}" data-status="active">Unblock</button>`
            }
            ${
              user.role === 'admin'
                ? `<button class="btn btn-outline btn-sm" type="button" data-user-role="${user.id}" data-role="student">Make student</button>`
                : `<button class="btn btn-outline btn-sm" type="button" data-user-role="${user.id}" data-role="admin">Make admin</button>`
            }
            <button class="btn btn-outline btn-sm" type="button" data-user-delete="${user.id}">Delete</button>
          </div>
        </td>
      </tr>`
    );

    const wrap = document.getElementById('adminUsers');
    wrap.innerHTML = table(['User', 'ID / Dept', 'Role', 'Status', 'Reports', 'Joined', 'Actions'], rows);

    wrap.querySelectorAll('[data-user-block]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await FindIt.api.patch(`/admin/users/${btn.dataset.userBlock}`, { status: btn.dataset.status });
          UI.toast(`User ${btn.dataset.status === 'blocked' ? 'blocked' : 'unblocked'}.`, 'success');
          loadUsers();
          loadStats();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });

    wrap.querySelectorAll('[data-user-role]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await UI.confirm({
          title: `Change role to ${btn.dataset.role}?`,
          message:
            btn.dataset.role === 'admin'
              ? 'This user will get full access to the admin dashboard.'
              : 'This user will lose admin access.',
          confirmText: 'Change role',
        });
        if (!ok) return;
        try {
          await FindIt.api.patch(`/admin/users/${btn.dataset.userRole}`, { role: btn.dataset.role });
          UI.toast('User role updated.', 'success');
          loadUsers();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });

    wrap.querySelectorAll('[data-user-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await UI.confirm({
          title: 'Delete this user?',
          message: 'Their reports, claims and notifications will also be deleted.',
          confirmText: 'Delete user',
          danger: true,
        });
        if (!ok) return;
        try {
          await FindIt.api.del(`/admin/users/${btn.dataset.userDelete}`);
          UI.toast('User deleted.', 'success');
          loadUsers();
          loadStats();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  /* --------------------------------- claims -------------------------------- */
  function renderClaims() {
    const wrap = document.getElementById('adminClaims');
    if (!state.claims.length) {
      wrap.innerHTML = UI.emptyState({ title: 'No claims', message: 'Claim requests will appear here.', icon: 'ticket' });
      return;
    }
    wrap.innerHTML = state.claims
      .map(
        (claim) => `
      <div class="claim-card">
        <div class="claim-head">
          <div>
            <a href="/item.html?id=${encodeURIComponent(claim.itemId)}"><strong>${UI.esc(claim.itemTitle)}</strong></a>
            <div class="sub small muted">
              ${UI.esc(claim.claimantName)} (${UI.esc(claim.claimantEmail)}) · ${UI.formatDate(claim.createdAt, true)}
            </div>
          </div>
          ${UI.statusBadge(claim.status)}
        </div>
        <div class="claim-quote"><small>Message</small>${UI.esc(claim.message)}</div>
        <div class="claim-quote"><small>Proof</small>${UI.esc(claim.proof)}</div>
      </div>`
      )
      .join('');
  }

  /* --------------------------------- flags --------------------------------- */
  function renderReports() {
    const wrap = document.getElementById('adminReports');
    if (!state.reports.length) {
      wrap.innerHTML = UI.emptyState({ title: 'No flags', message: 'Reported listings will show up here.', icon: 'flag' });
      return;
    }
    wrap.innerHTML = state.reports
      .map(
        (report) => `
      <div class="list-row">
        <div class="list-thumb">${UI.icon('flag')}</div>
        <div class="list-main">
          <strong>${UI.esc(report.itemTitle || 'Listing')}</strong>
          <div class="sub">
            <span>${UI.esc(report.reason)}</span>
            <span>by ${UI.esc(report.reporterName)}</span>
            <span>${UI.timeAgo(report.createdAt)}</span>
            ${report.status === 'resolved' ? '<span class="badge badge-found">Resolved</span>' : '<span class="badge badge-pending">Open</span>'}
          </div>
          ${report.details ? `<div class="small muted">${UI.esc(report.details)}</div>` : ''}
        </div>
        <div class="list-actions">
          <a class="btn btn-outline btn-sm" href="/item.html?id=${report.itemId}">View item</a>
          ${
            report.status === 'open'
              ? `<button class="btn btn-success btn-sm" type="button" data-resolve="${report.id}">Mark resolved</button>
                 <button class="btn btn-outline btn-sm" type="button" data-remove-item="${report.itemId}">Remove listing</button>`
              : ''
          }
        </div>
      </div>`
      )
      .join('');

    wrap.querySelectorAll('[data-resolve]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await FindIt.api.patch(`/admin/reports/${btn.dataset.resolve}`, { status: 'resolved' });
          UI.toast('Flag marked as resolved.', 'success');
          loadReports();
          loadStats();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });

    wrap.querySelectorAll('[data-remove-item]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await UI.confirm({
          title: 'Remove this listing?',
          message: 'The listing will be hidden from the portal and the owner notified.',
          confirmText: 'Remove listing',
          danger: true,
        });
        if (!ok) return;
        try {
          await FindIt.api.patch(`/admin/items/${btn.dataset.removeItem}/status`, {
            status: 'removed',
            adminNote: 'Removed after a user report.',
          });
          UI.toast('Listing removed.', 'success');
          loadReports();
          loadStats();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  /* -------------------------------- messages ------------------------------- */
  function renderMessages() {
    const wrap = document.getElementById('adminMessages');
    if (!state.messages.length) {
      wrap.innerHTML = UI.emptyState({ title: 'No messages', message: 'Contact form submissions appear here.', icon: 'message' });
      return;
    }
    wrap.innerHTML = state.messages
      .map(
        (msg) => `
      <div class="claim-card" style="${msg.status === 'new' ? 'border-left:3px solid var(--sky-400)' : ''}">
        <div class="claim-head">
          <div>
            <strong>${UI.esc(msg.subject)}</strong>
            <div class="sub small muted">${UI.esc(msg.name)} · ${UI.esc(msg.email)} · ${UI.formatDate(msg.createdAt, true)}</div>
          </div>
          <div class="row">
            ${msg.status === 'new' ? '<span class="badge badge-pending">New</span>' : '<span class="badge">Read</span>'}
            ${msg.status === 'new' ? `<button class="btn btn-outline btn-sm" type="button" data-read="${msg.id}">Mark read</button>` : ''}
            <a class="btn btn-outline btn-sm" href="mailto:${UI.esc(msg.email)}?subject=Re: ${encodeURIComponent(msg.subject)}">Reply</a>
          </div>
        </div>
        <p class="small" style="margin:0;color:var(--text-soft)">${UI.esc(msg.message)}</p>
      </div>`
      )
      .join('');

    wrap.querySelectorAll('[data-read]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await FindIt.api.patch(`/admin/messages/${btn.dataset.read}`);
          UI.toast('Marked as read.', 'success');
          loadMessages();
          loadStats();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  /* ---------------------------------- data --------------------------------- */
  async function loadStats() {
    try {
      state.stats = await FindIt.api.get('/admin/stats');
      renderStats();
      document.getElementById('badgePending').textContent = state.stats.pending || 0;
      document.getElementById('badgeReports').textContent = state.stats.openReports || 0;
      document.getElementById('badgeMessages').textContent = state.stats.newMessages || 0;
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function loadItems() {
    try {
      const params = new URLSearchParams();
      if (state.status) params.set('status', state.status);
      if (state.q) params.set('q', state.q);
      params.set('limit', '100');
      const data = await FindIt.api.get(`/admin/items?${params}`);
      state.items = data.items;
      document.getElementById('badgeItems').textContent = data.total;
      renderItems();
      renderPending();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function loadUsers() {
    try {
      const q = document.getElementById('userSearch').value.trim();
      const data = await FindIt.api.get(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      state.users = data.users;
      document.getElementById('badgeUsers').textContent = data.users.length;
      renderUsers();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function loadClaims() {
    try {
      const status = document.getElementById('claimFilter').value;
      const data = await FindIt.api.get(`/admin/claims${status ? `?status=${status}` : ''}`);
      state.claims = data.claims;
      document.getElementById('badgeClaims').textContent = data.claims.length;
      renderClaims();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function loadReports() {
    try {
      const data = await FindIt.api.get('/admin/reports');
      state.reports = data.reports;
      renderReports();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function loadMessages() {
    try {
      const data = await FindIt.api.get('/admin/messages');
      state.messages = data.messages;
      renderMessages();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  /* ------------------------------- navigation ------------------------------ */
  function showPanel(name) {
    document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
    document.querySelectorAll('#adminLinks button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.panel === name);
    });
    const panel = document.getElementById(`panel-${name}`);
    if (panel) panel.classList.add('active');
    if (window.location.hash !== `#${name}`) window.history.replaceState({}, '', `#${name}`);
    if (name === 'claims') loadClaims();
    if (name === 'reports') loadReports();
    if (name === 'messages') loadMessages();
    if (name === 'users') loadUsers();
  }

  function showGate() {
    document.getElementById('adminLayout').classList.add('hidden');
    const gate = document.getElementById('adminGate');
    gate.classList.remove('hidden');
    gate.innerHTML = UI.emptyState({
      title: 'Administrator access required',
      message: 'Please sign in with an administrator account to open this dashboard.',
      actionHTML: `<a class="btn btn-primary" href="/login.html?admin=1">Admin login</a>
                   <a class="btn btn-outline" href="/">Back to home</a>`,
      icon: 'lock',
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await FindIt.session.ready;
    if (!FindIt.session.isAdmin()) {
      showGate();
      return;
    }

    document.getElementById('adminName').textContent = FindIt.session.user.name;
    document.getElementById('adminEmail').textContent = FindIt.session.user.email;

    document.getElementById('adminLinks').addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-panel]');
      if (btn) showPanel(btn.dataset.panel);
    });

    document.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => showPanel(btn.dataset.goto));
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
      loadStats();
      loadItems();
      loadUsers();
      UI.toast('Dashboard refreshed.', 'success', 1800);
    });

    document.getElementById('itemStatusChips').addEventListener('click', (event) => {
      const chip = event.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#itemStatusChips .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.status = chip.dataset.status;
      loadItems();
    });

    document.getElementById('itemSearch').addEventListener(
      'input',
      UI.debounce((event) => {
        state.q = event.target.value.trim();
        loadItems();
      }, 400)
    );

    document.getElementById('userSearch').addEventListener('input', UI.debounce(loadUsers, 400));
    document.getElementById('claimFilter').addEventListener('change', loadClaims);

    const hash = window.location.hash.replace('#', '');
    if (hash) showPanel(hash);

    loadStats();
    loadItems();
    loadUsers();
  });
})();
