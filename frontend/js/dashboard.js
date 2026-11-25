/* User dashboard: my reports, my claims, claim requests, notifications */
(function () {
  const state = {
    profile: null,
    lost: [],
    found: [],
    claims: [],
    received: [],
    notifications: [],
  };

  /* -------------------------------- rendering ------------------------------ */
  function itemRow(item) {
    const thumb = item.imageUrl
      ? `<img src="${UI.esc(item.imageUrl)}" alt="" />`
      : UI.icon(UI.categoryIcon(item.category));

    const pendingBadge = item.pendingCount
      ? `<span class="badge badge-pending">${item.pendingCount} pending claim${item.pendingCount > 1 ? 's' : ''}</span>`
      : '';

    const actions = [
      `<a class="btn btn-outline btn-sm" href="/item.html?id=${encodeURIComponent(item.id)}">View</a>`,
      `<a class="btn btn-outline btn-sm" href="/report.html?type=${item.type}&edit=${encodeURIComponent(item.id)}">Edit</a>`,
      item.status !== 'returned'
        ? `<button class="btn btn-success btn-sm" data-return="${item.id}" type="button">Mark returned</button>`
        : '',
      `<button class="btn btn-outline btn-sm" data-delete="${item.id}" type="button">Delete</button>`,
    ]
      .filter(Boolean)
      .join('');

    return `
      <div class="list-row">
        <div class="list-thumb">${thumb}</div>
        <div class="list-main">
          <strong>${UI.esc(item.title)}</strong>
          <div class="sub">
            ${UI.typeBadge(item.type)}
            ${UI.statusBadge(item.status)}
            <span>${UI.esc(item.category)}</span>
            <span>${UI.formatDate(item.dateLostFound)}</span>
            <span>${item.claimsCount || 0} claim${item.claimsCount === 1 ? '' : 's'}</span>
            ${pendingBadge}
          </div>
        </div>
        <div class="list-actions">${actions}</div>
      </div>`;
  }

  function claimCard(claim, mode) {
    const actions =
      mode === 'received' && claim.status === 'pending'
        ? `<button class="btn btn-success btn-sm" data-accept="${claim.id}" type="button">Accept</button>
           <button class="btn btn-outline btn-sm" data-reject="${claim.id}" type="button">Reject</button>`
        : mode === 'sent' && claim.status === 'pending'
        ? `<button class="btn btn-outline btn-sm" data-withdraw="${claim.id}" type="button">Withdraw claim</button>`
        : '';

    return `
      <div class="claim-card">
        <div class="claim-head">
          <div>
            <a href="/item.html?id=${encodeURIComponent(claim.itemId)}"><strong>${UI.esc(claim.itemTitle)}</strong></a>
            <div class="sub small muted">
              ${mode === 'received' ? `From ${UI.esc(claim.claimantName)}` : 'Your claim'} ·
              ${UI.formatDate(claim.createdAt, true)}
            </div>
          </div>
          <div class="row">${UI.statusBadge(claim.status)}</div>
        </div>
        <div class="claim-quote"><small>Message</small>${UI.esc(claim.message)}</div>
        <div class="claim-quote"><small>Proof of ownership</small>${UI.esc(claim.proof)}</div>
        ${
          claim.proofImage
            ? `<img src="${UI.esc(claim.proofImage)}" alt="Proof" style="max-width:200px;border-radius:12px;margin-bottom:10px" />`
            : ''
        }
        ${
          claim.decisionNote
            ? `<div class="alert alert-info" style="margin-bottom:10px">${UI.icon('info')}<div class="small">${UI.esc(
                claim.decisionNote
              )}</div></div>`
            : ''
        }
        ${mode === 'received' ? `<div class="small muted mb-2">Contact: ${UI.esc(claim.claimantEmail)}</div>` : ''}
        <div class="row">${actions}</div>
      </div>`;
  }

  function renderOverview() {
    const stats = state.profile ? state.profile.stats : {};
    const values = [stats.lostCount || 0, stats.foundCount || 0, stats.returnedCount || 0, stats.pendingClaims || 0];
    document.querySelectorAll('#overviewStats .mini-stat strong').forEach((el, index) => {
      el.textContent = values[index];
    });

    const recent = [...state.lost, ...state.found].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 4);

    const wrap = document.getElementById('overviewActivity');
    if (!recent.length) {
      wrap.innerHTML = UI.emptyState({
        title: 'You have not reported anything yet',
        message: 'Report a lost or found item to see it here.',
        actionHTML: `<a class="btn btn-primary" href="/report.html?type=lost">Report an item</a>`,
        icon: 'inbox',
      });
    } else {
      wrap.innerHTML = recent.map((item) => itemRow(item)).join('');
    }
    wireRowActions(wrap);
  }

  function renderLists() {
    const lostWrap = document.getElementById('lostList');
    const foundWrap = document.getElementById('foundList');

    lostWrap.innerHTML = state.lost.length
      ? state.lost.map((item) => itemRow(item)).join('')
      : UI.emptyState({
          title: 'No lost items reported',
          message: 'When you report a lost item it will appear here.',
          actionHTML: `<a class="btn btn-primary" href="/report.html?type=lost">Report a lost item</a>`,
          icon: 'search',
        });

    foundWrap.innerHTML = state.found.length
      ? state.found.map((item) => itemRow(item)).join('')
      : UI.emptyState({
          title: 'No found items reported',
          message: 'Found something on campus? Post it so the owner can claim it.',
          actionHTML: `<a class="btn btn-primary" href="/report.html?type=found">Report a found item</a>`,
          icon: 'checkCircle',
        });

    wireRowActions(lostWrap);
    wireRowActions(foundWrap);
  }

  function renderClaims() {
    const wrap = document.getElementById('claimsList');
    wrap.innerHTML = state.claims.length
      ? state.claims.map((claim) => claimCard(claim, 'sent')).join('')
      : UI.emptyState({
          title: 'No claims yet',
          message: 'Found your item in the listings? Open it and submit proof of ownership.',
          actionHTML: `<a class="btn btn-primary" href="/browse.html">Browse items</a>`,
          icon: 'ticket',
        });
    wireClaimActions(wrap, 'sent');
  }

  function renderReceived() {
    const wrap = document.getElementById('receivedList');
    wrap.innerHTML = state.received.length
      ? state.received.map((claim) => claimCard(claim, 'received')).join('')
      : UI.emptyState({
          title: 'No claim requests',
          message: 'Claims on the items you reported will show up here for review.',
          icon: 'inbox',
        });
    wireClaimActions(wrap, 'received');
  }

  function renderNotifications() {
    const wrap = document.getElementById('notifList');
    if (!state.notifications.length) {
      wrap.innerHTML = UI.emptyState({
        title: 'Nothing new',
        message: 'You will be notified when someone claims your item or replies to you.',
        icon: 'bell',
      });
      return;
    }
    wrap.innerHTML = state.notifications
      .map(
        (n) => `
      <div class="list-row" style="${n.read ? '' : 'background: #f7fbff'}">
        <div class="list-thumb" style="width:44px;height:44px;border-radius:12px;background:var(--light-blue)">
          ${UI.icon(n.type === 'success' ? 'checkCircle' : n.type === 'warning' ? 'alertTriangle' : n.type === 'claim' ? 'ticket' : 'info')}
        </div>
        <div class="list-main">
          <strong>${UI.esc(n.title)}</strong>
          <div class="sub"><span>${UI.esc(n.message)}</span></div>
          <div class="sub muted">${UI.timeAgo(n.createdAt)}${n.read ? '' : ' · unread'}</div>
        </div>
        <div class="list-actions">
          ${n.link ? `<a class="btn btn-outline btn-sm" href="${UI.esc(n.link)}">Open</a>` : ''}
          <button class="btn btn-outline btn-sm" type="button" data-notif-del="${n.id}">Remove</button>
        </div>
      </div>`
      )
      .join('');

    wrap.querySelectorAll('[data-notif-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await FindIt.api.del(`/notifications/${btn.dataset.notifDel}`);
          state.notifications = state.notifications.filter((n) => n.id !== btn.dataset.notifDel);
          renderNotifications();
          UI.toast('Notification removed.', 'success');
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  /* -------------------------------- actions -------------------------------- */
  function wireRowActions(scope) {
    scope.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await UI.confirm({
          title: 'Delete this report?',
          message: 'The listing and all its claims will be removed permanently.',
          confirmText: 'Delete',
          danger: true,
        });
        if (!ok) return;
        try {
          await FindIt.api.del(`/items/${btn.dataset.delete}`);
          UI.toast('Report deleted.', 'success');
          loadAll();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });

    scope.querySelectorAll('[data-return]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await UI.confirm({
          title: 'Mark as returned?',
          message: 'The listing will close and stop accepting claims.',
          confirmText: 'Yes, mark returned',
        });
        if (!ok) return;
        try {
          await FindIt.api.patch(`/items/${btn.dataset.return}/returned`, {});
          UI.toast('Item marked as returned.', 'success');
          loadAll();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  function wireClaimActions(scope, mode) {
    scope.querySelectorAll('[data-accept]').forEach((btn) => {
      btn.addEventListener('click', () => decideClaim(btn.dataset.accept, 'accept'));
    });
    scope.querySelectorAll('[data-reject]').forEach((btn) => {
      btn.addEventListener('click', () => decideClaim(btn.dataset.reject, 'reject'));
    });
    scope.querySelectorAll('[data-withdraw]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await UI.confirm({
          title: 'Withdraw this claim?',
          message: 'You can submit a new claim later if the item is still available.',
          confirmText: 'Withdraw',
          danger: true,
        });
        if (!ok) return;
        try {
          await FindIt.api.del(`/claims/${btn.dataset.withdraw}`);
          UI.toast('Claim withdrawn.', 'success');
          loadAll();
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });
  }

  async function decideClaim(claimId, decision) {
    const dialog = UI.modal({
      title: decision === 'accept' ? 'Accept this claim' : 'Reject this claim',
      subtitle:
        decision === 'accept'
          ? 'The item will be marked as returned and other claims will be closed automatically.'
          : 'The claimant will be notified that their proof could not be verified.',
      body: `
        <div class="form-group">
          <label for="decisionNote">Note to the claimant (optional)</label>
          <textarea class="textarea" id="decisionNote" placeholder="${
            decision === 'accept'
              ? 'Verified the engraving — please collect from the student affairs office.'
              : 'Sorry, the description does not match the item.'
          }"></textarea>
        </div>`,
      footer: `
        <button class="btn btn-outline" type="button" data-close>Cancel</button>
        <button class="btn ${decision === 'accept' ? 'btn-success' : 'btn-danger'}" type="button" id="confirmDecision">
          ${decision === 'accept' ? 'Accept claim' : 'Reject claim'}
        </button>`,
    });

    dialog.element.querySelector('[data-close]').addEventListener('click', dialog.close);
    const btn = dialog.element.querySelector('#confirmDecision');
    btn.addEventListener('click', async () => {
      UI.setLoading(btn, true, 'Saving…');
      try {
        const data = await FindIt.api.patch(`/claims/${claimId}/${decision}`, {
          note: dialog.element.querySelector('#decisionNote').value.trim(),
        });
        dialog.close();
        UI.toast(data.message, 'success');
        loadAll();
      } catch (err) {
        UI.toast(err.message, 'error');
        UI.setLoading(btn, false);
      }
    });
  }

  /* ------------------------------- navigation ------------------------------ */
  function showPanel(name) {
    document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
    document.querySelectorAll('#dashLinks button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.panel === name);
    });
    const panel = document.getElementById(`panel-${name}`);
    if (panel) panel.classList.add('active');
    if (window.location.hash !== `#${name}`) {
      window.history.replaceState({}, '', `#${name}`);
    }
  }

  /* ---------------------------------- load --------------------------------- */
  async function loadAll() {
    try {
      const [profile, lost, found, claims, received, notifications] = await Promise.all([
        FindIt.api.get('/users/me'),
        FindIt.api.get('/users/me/items?type=lost'),
        FindIt.api.get('/users/me/items?type=found'),
        FindIt.api.get('/claims/mine'),
        FindIt.api.get('/claims/received'),
        FindIt.api.get('/notifications'),
      ]);

      state.profile = profile;
      state.lost = lost.items;
      state.found = found.items;
      state.claims = claims.claims;
      state.received = received.claims;
      state.notifications = notifications.notifications;

      document.getElementById('dashUserName').textContent = profile.user.name;
      document.getElementById('dashUserEmail').textContent = profile.user.email;
      document.getElementById('dashTitle').textContent = `Welcome back, ${UI.firstName(profile.user.name)}`;

      document.getElementById('countLost').textContent = state.lost.length;
      document.getElementById('countFound').textContent = state.found.length;
      document.getElementById('countClaims').textContent = state.claims.length;
      document.getElementById('countReceived').textContent = state.received.filter((c) => c.status === 'pending').length;
      document.getElementById('countNotif').textContent = notifications.unread || 0;
      if (FindIt.layout) FindIt.layout.updateBellCount(notifications.unread || 0);

      renderOverview();
      renderLists();
      renderClaims();
      renderReceived();
      renderNotifications();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await FindIt.session.ready;
    if (!FindIt.session.isLoggedIn()) {
      FindIt.session.requireLogin('Please log in to view your dashboard.');
      return;
    }

    document.getElementById('dashLinks').addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-panel]');
      if (btn) showPanel(btn.dataset.panel);
    });

    document.getElementById('markAllRead').addEventListener('click', async () => {
      try {
        await FindIt.api.patch('/notifications/read-all');
        UI.toast('All notifications marked as read.', 'success');
        loadAll();
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });

    const hash = window.location.hash.replace('#', '');
    if (hash) showPanel(hash);

    loadAll();
  });
})();
