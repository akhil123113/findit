/* Item detail page: contact reveal, claim request, mark returned, report listing */
(function () {
  const root = document.getElementById('detailRoot');
  const itemId = UI.qs('id');
  let item = null;
  let myClaim = null;

  /* ------------------------------- rendering ------------------------------- */
  function render() {
    const session = FindIt.session;
    const isOwner = Boolean(item.isOwner);
    const isReturned = item.status === 'returned';
    const contact = item.contact || {};

    const media = item.imageUrl
      ? `<div class="detail-media" id="detailMedia" role="button" tabindex="0" aria-label="Open image">
           <img src="${UI.esc(item.imageUrl)}" alt="${UI.esc(item.title)}" />
           <div class="media-badges">${UI.typeBadge(item.type)}${UI.statusBadge(item.status)}</div>
         </div>`
      : `<div class="detail-media" style="cursor:default">
           <div class="no-image">${UI.icon(UI.categoryIcon(item.category))}</div>
           <div class="media-badges">${UI.typeBadge(item.type)}${UI.statusBadge(item.status)}</div>
         </div>`;

    const claimBanner = myClaim
      ? `<div class="alert ${
          myClaim.status === 'accepted'
            ? 'alert-success'
            : myClaim.status === 'rejected'
            ? 'alert-error'
            : 'alert-info'
        }">
          ${UI.icon(myClaim.status === 'accepted' ? 'checkCircle' : myClaim.status === 'rejected' ? 'alertCircle' : 'info')}
          <div>
            <strong>Your claim is ${UI.esc(myClaim.status)}.</strong>
            ${
              myClaim.decisionNote
                ? `<div class="small">${UI.esc(myClaim.decisionNote)}</div>`
                : `<div class="small">Submitted ${UI.timeAgo(myClaim.createdAt)}. The reporter will review your proof of ownership.</div>`
            }
          </div>
        </div>`
      : '';

    const returnedBanner = isReturned
      ? `<div class="alert alert-success">
          ${UI.icon('checkCircle')}
          <div><strong>This item has been returned.</strong>
          <div class="small">${
            item.returnedTo ? `Handed over to ${UI.esc(item.returnedTo)}.` : 'The listing is closed.'
          }</div></div>
        </div>`
      : '';

    let actions = '';
    if (isOwner) {
      actions = `
        <a class="btn btn-primary" href="/report.html?type=${item.type}&edit=${item.id}">
          ${UI.icon('edit')} Edit report
        </a>
        ${!isReturned ? `<button class="btn btn-success" id="markReturnedBtn" type="button">${UI.icon('check')} Mark as returned</button>` : ''}
        <button class="btn btn-outline" id="deleteBtn" type="button">${UI.icon('trash')} Delete</button>`;
    } else if (isReturned) {
      actions = `<a class="btn btn-outline" href="/browse.html">${UI.icon('search')} Browse other items</a>`;
    } else if (!session.isLoggedIn()) {
      actions = `
        <button class="btn btn-primary" id="contactBtn" type="button">${UI.icon('mail')} Contact reporter</button>
        <button class="btn btn-outline" id="claimBtn" type="button">${UI.icon('ticket')} Claim this item</button>`;
    } else {
      actions = `
        <button class="btn btn-primary" id="contactBtn" type="button">${UI.icon('mail')} Contact reporter</button>
        <button class="btn btn-outline" id="claimBtn" type="button" ${
          myClaim ? 'disabled' : ''
        }>${UI.icon('ticket')} ${myClaim ? 'Claim submitted' : 'Claim this item'}</button>`;
    }

    root.innerHTML = `
      <div class="detail-layout">
        <div>
          ${media}
          <div class="card card-pad mt-3">
            <h3 style="font-size:1rem;display:flex;align-items:center;gap:8px">
              ${UI.icon('shield')} Safety first
            </h3>
            <p class="small muted" style="margin:0">
              Always meet in a public place on campus — the library, security desk or student
              affairs office. Never pay money to claim an item. Report suspicious listings using
              the flag button.
            </p>
          </div>
        </div>

        <div class="card detail-panel">
          ${claimBanner}
          ${returnedBanner}
          <div class="row" style="gap:8px">
            ${UI.typeBadge(item.type)}
            <span class="badge">${UI.icon('tag')} ${UI.esc(item.category)}</span>
            ${UI.statusBadge(item.status)}
          </div>

          <h1>${UI.esc(item.title)}</h1>
          <p class="muted small" style="margin-top:-4px">
            ${UI.icon('eye', 'inline')} ${item.views} views · reported ${UI.timeAgo(item.createdAt)}
            by ${UI.esc(item.ownerName || 'a campus member')}
          </p>

          <div class="meta-list">
            <div class="meta-item">
              <span class="ico">${UI.icon('calendar')}</span>
              <div>
                <small>${item.type === 'lost' ? 'Date lost' : 'Date found'}</small>
                <span>${UI.formatDate(item.dateLostFound)}</span>
              </div>
            </div>
            <div class="meta-item">
              <span class="ico">${UI.icon('mapPin')}</span>
              <div>
                <small>Location</small>
                <span>${UI.esc(item.location)}</span>
              </div>
            </div>
            <div class="meta-item">
              <span class="ico">${UI.icon('tag')}</span>
              <div>
                <small>Category</small>
                <span>${UI.esc(item.category)}</span>
              </div>
            </div>
            <div class="meta-item">
              <span class="ico">${UI.icon('clock')}</span>
              <div>
                <small>Status</small>
                <span style="text-transform:capitalize">${UI.esc(item.status)}</span>
              </div>
            </div>
          </div>

          <h3 style="font-size:1rem">Description</h3>
          <p class="description">${UI.esc(item.description)}</p>

          <div class="contact-card">
            <h4>Contact ${item.type === 'lost' ? 'the owner' : 'the finder'}</h4>
            <div class="contact-row ${contact.revealed ? '' : 'masked'}" id="contactEmailRow">
              ${UI.icon('mail')} ${UI.esc(contact.email || 'Hidden')}
            </div>
            ${
              contact.phone
                ? `<div class="contact-row ${contact.revealed ? '' : 'masked'}" id="contactPhoneRow">
                    ${UI.icon('phone')} ${UI.esc(contact.phone)}
                  </div>`
                : ''
            }
            <div class="contact-row">${UI.icon('user')} ${UI.esc(contact.ownerName || item.ownerName || 'Registered user')}</div>
            ${
              contact.revealed
                ? ''
                : `<div class="sidebar-note">${UI.icon('lock')}
                    <span>Contact details are masked to protect privacy. Log in and tap
                    “Contact reporter” to unlock them — the reporter is notified.</span></div>`
            }
          </div>

          <div class="action-bar">${actions}</div>

          <div class="sidebar-note">
            ${UI.icon('flag')}
            <span>
              Something wrong with this listing?
              <button class="btn-ghost btn-sm" id="reportListingBtn" type="button" style="padding:0 4px">Report it</button>
            </span>
          </div>
        </div>
      </div>`;

    document.getElementById('crumbTitle').textContent = item.title;
    document.title = `${item.title} — FindIt`;
    wire();
  }

  /* -------------------------------- actions -------------------------------- */
  async function revealContact() {
    if (!FindIt.session.requireLogin('Please log in to contact the reporter.')) return;
    try {
      const data = await FindIt.api.post(`/items/${item.id}/contact`, {
        message: `Hi, I am interested in your ${item.type} item "${item.title}".`,
      });
      item.contact = { ...data.contact, revealed: true, ownerName: data.contact.name };
      render();
      UI.toast('Contact details unlocked. The reporter has been notified.', 'success');
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  function openClaimModal() {
    if (!FindIt.session.requireLogin('Please log in to claim this item.')) return;

    const dialog = UI.modal({
      title: 'Claim this item',
      subtitle: 'Describe the item and prove it is yours. The reporter will review your request.',
      body: `
        <form id="claimForm" novalidate>
          <div class="alert alert-info">
            ${UI.icon('info')}
            <div class="small">Be specific: mention unique marks, engravings, contents or a
            purchase receipt. Vague claims are usually rejected.</div>
          </div>
          <div class="form-group">
            <label for="claimMessage">Message to the reporter <span class="req">*</span></label>
            <textarea class="textarea" id="claimMessage" name="message" placeholder="Hi, I think this is my item. I lost it near…" required></textarea>
            <div class="field-error"></div>
          </div>
          <div class="form-group">
            <label for="claimProof">Proof of ownership <span class="req">*</span></label>
            <textarea class="textarea" id="claimProof" name="proof" placeholder="Unique marks, serial number, contents of the bag, receipt details…" required></textarea>
            <div class="field-error"></div>
          </div>
          <div class="form-group">
            <label for="claimProofImage">Supporting image (optional)</label>
            <div class="upload-box">
              <input type="file" id="claimProofImage" accept="image/*" />
              <div class="up-ico">${UI.icon('camera')}</div>
              <strong>Upload a photo of the item or a receipt</strong>
              <span>JPG, PNG or WEBP · up to 5 MB</span>
            </div>
            <div class="preview-wrap hidden" id="claimPreview"></div>
          </div>
        </form>`,
      footer: `
        <button class="btn btn-outline" type="button" data-close>Cancel</button>
        <button class="btn btn-primary" type="button" id="submitClaim">Submit claim</button>`,
    });

    dialog.element.querySelector('[data-close]').addEventListener('click', dialog.close);
    UI.bindImagePreview(
      dialog.element.querySelector('#claimProofImage'),
      dialog.element.querySelector('#claimPreview')
    );

    const submitBtn = dialog.element.querySelector('#submitClaim');
    submitBtn.addEventListener('click', async () => {
      const form = dialog.element.querySelector('#claimForm');
      const message = form.querySelector('#claimMessage');
      const proof = form.querySelector('#claimProof');
      let valid = true;
      [message, proof].forEach((field) => {
        if (field.value.trim().length < 10) {
          UI.fieldError(field, 'Please write at least 10 characters.');
          valid = false;
        } else {
          UI.fieldError(field, '');
        }
      });
      if (!valid) return;

      const formData = new FormData();
      formData.append('itemId', item.id);
      formData.append('message', message.value.trim());
      formData.append('proof', proof.value.trim());
      const file = form.querySelector('#claimProofImage').files[0];
      if (file) formData.append('proofImage', file);

      UI.setLoading(submitBtn, true, 'Submitting…');
      try {
        await FindIt.api.postForm('/claims', formData);
        dialog.close();
        UI.toast('Claim submitted! The finder will review your proof of ownership.', 'success');
        load();
      } catch (err) {
        UI.toast(err.message, 'error');
        UI.setLoading(submitBtn, false);
      }
    });
  }

  async function markReturned() {
    const ok = await UI.confirm({
      title: 'Mark this item as returned?',
      message: 'The listing will close and stop accepting new claims. This cannot be undone.',
      confirmText: 'Yes, mark returned',
    });
    if (!ok) return;
    try {
      await FindIt.api.patch(`/items/${item.id}/returned`, {});
      UI.toast('Marked as returned. Thanks for updating the portal!', 'success');
      load();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function deleteItem() {
    const ok = await UI.confirm({
      title: 'Delete this report?',
      message: 'The listing and all related claims will be removed permanently.',
      confirmText: 'Delete report',
      danger: true,
    });
    if (!ok) return;
    try {
      await FindIt.api.del(`/items/${item.id}`);
      UI.toast('Report deleted.', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 700);
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  function openReportModal() {
    const reasons = [
      'Fake or duplicate listing',
      'Inappropriate content',
      'Wrong category',
      'Suspected scam',
      'Item already returned',
      'Other',
    ];
    const dialog = UI.modal({
      title: 'Report this listing',
      subtitle: 'Our administrators will review the listing and take action if needed.',
      body: `
        <div class="form-group">
          <label for="reportReason">Reason</label>
          <select class="select" id="reportReason">
            ${reasons.map((reason) => `<option>${reason}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="reportDetails">Details (optional)</label>
          <textarea class="textarea" id="reportDetails" placeholder="Tell us what looks wrong…"></textarea>
        </div>`,
      footer: `
        <button class="btn btn-outline" type="button" data-close>Cancel</button>
        <button class="btn btn-danger" type="button" id="sendReport">Send report</button>`,
    });
    dialog.element.querySelector('[data-close]').addEventListener('click', dialog.close);
    const btn = dialog.element.querySelector('#sendReport');
    btn.addEventListener('click', async () => {
      UI.setLoading(btn, true, 'Sending…');
      try {
        await FindIt.api.post(`/items/${item.id}/report`, {
          reason: dialog.element.querySelector('#reportReason').value,
          details: dialog.element.querySelector('#reportDetails').value,
        });
        dialog.close();
        UI.toast('Thanks for flagging this. Our team will review it.', 'success');
      } catch (err) {
        UI.toast(err.message, 'error');
        UI.setLoading(btn, false);
      }
    });
  }

  function wire() {
    const media = document.getElementById('detailMedia');
    if (media) {
      const open = () => UI.lightbox(item.imageUrl, item.title);
      media.addEventListener('click', open);
      media.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') open();
      });
    }

    const contactBtn = document.getElementById('contactBtn');
    if (contactBtn) contactBtn.addEventListener('click', revealContact);

    const claimBtn = document.getElementById('claimBtn');
    if (claimBtn) claimBtn.addEventListener('click', openClaimModal);

    const returnedBtn = document.getElementById('markReturnedBtn');
    if (returnedBtn) returnedBtn.addEventListener('click', markReturned);

    const delBtn = document.getElementById('deleteBtn');
    if (delBtn) delBtn.addEventListener('click', deleteItem);

    const reportBtn = document.getElementById('reportListingBtn');
    if (reportBtn) reportBtn.addEventListener('click', openReportModal);
  }

  /* --------------------------------- load --------------------------------- */
  async function load() {
    await FindIt.session.ready;
    if (!itemId) {
      root.innerHTML = UI.emptyState({
        title: 'No item selected',
        message: 'The link you followed does not include an item.',
        actionHTML: `<a class="btn btn-primary" href="/browse.html">Browse items</a>`,
        icon: 'search',
      });
      return;
    }
    try {
      const data = await FindIt.api.get(`/items/${itemId}`);
      item = data.item;
      myClaim = data.myClaim;
      render();
    } catch (err) {
      root.innerHTML = UI.emptyState({
        title: err.status === 404 ? 'Item not found' : 'Could not load this item',
        message:
          err.status === 404
            ? 'This listing may have been removed, rejected or marked as returned by its owner.'
            : err.message,
        actionHTML: `<a class="btn btn-primary" href="/browse.html">Browse other items</a>`,
        icon: err.status === 404 ? 'inbox' : 'alertCircle',
      });
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
