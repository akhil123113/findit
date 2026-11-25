/* Report page: creates a new lost/found item or edits an existing one */
(function () {
  const form = document.getElementById('itemForm');
  const alertBox = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');
  const typeTabs = document.getElementById('typeTabs');

  let type = UI.qs('type') === 'found' ? 'found' : 'lost';
  const editId = UI.qs('edit');
  let editing = null;

  const COPY = {
    lost: {
      title: 'Report a lost item',
      subtitle:
        'Tell us what you lost and where. The more detail you add, the easier it is for the finder to recognise it.',
      dateLabel: 'Date lost',
      locationHint: 'Where exactly did you last see the item?',
      placeholder: 'e.g. Black Dell laptop with a blue sticker',
      button: 'Submit lost item report',
    },
    found: {
      title: 'Report a found item',
      subtitle:
        'Thank you for helping! Post what you found so the owner can find it. Keep one unique detail private so you can verify the claim.',
      dateLabel: 'Date found',
      locationHint: 'Where did you find it? Be specific (building, floor, room).',
      placeholder: 'e.g. Bunch of keys with a red keychain',
      button: 'Submit found item report',
    },
  };

  function applyType() {
    const copy = COPY[type];
    document.getElementById('pageTitle').textContent = editing ? 'Edit your report' : copy.title;
    document.getElementById('pageSubtitle').textContent = copy.subtitle;
    document.getElementById('crumbLabel').textContent = editing ? 'Edit report' : copy.title;
    document.getElementById('dateLabel').innerHTML = `${copy.dateLabel} <span class="req">*</span>`;
    document.getElementById('locationHint').textContent = copy.locationHint;
    document.getElementById('title').placeholder = copy.placeholder;
    submitBtn.textContent = editing ? 'Save changes' : copy.button;
    document.querySelectorAll('#typeTabs .tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.type === type);
    });
    document.title = `${editing ? 'Edit report' : copy.title} — FindIt`;
  }

  function validate() {
    UI.clearFormErrors(form);
    let valid = true;
    const fail = (id, message) => {
      UI.fieldError(document.getElementById(id), message);
      valid = false;
    };

    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const date = document.getElementById('dateLostFound').value;
    const location = document.getElementById('location').value.trim();
    const description = document.getElementById('description').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();

    if (title.length < 3) fail('title', 'Item name must be at least 3 characters.');
    if (!category) fail('category', 'Please choose a category.');
    if (!date) fail('dateLostFound', 'Please select a date.');
    else if (new Date(date) > new Date()) fail('dateLostFound', 'The date cannot be in the future.');
    if (location.length < 2) fail('location', 'Please add the location.');
    if (description.length < 10) fail('description', 'Please describe the item in at least 10 characters.');
    if (!UI.isEmail(email)) fail('contactEmail', 'Please enter a valid email address.');
    if (phone && !/^[+]?[\d\s\-()]{6,18}$/.test(phone)) fail('contactPhone', 'Please enter a valid phone number.');

    return valid;
  }

  function fillForm(item) {
    document.getElementById('title').value = item.title || '';
    document.getElementById('category').value = item.category || '';
    document.getElementById('description').value = item.description || '';
    document.getElementById('location').value = item.location || '';
    document.getElementById('contactEmail').value = item.contact && item.contact.email ? item.contact.email : '';
    document.getElementById('contactPhone').value = item.contact && item.contact.phone ? item.contact.phone : '';
    if (item.dateLostFound) {
      document.getElementById('dateLostFound').value = String(item.dateLostFound).slice(0, 10);
    }
    if (item.imageUrl) {
      const preview = document.getElementById('imagePreview');
      preview.classList.remove('hidden');
      preview.innerHTML = `<img src="${UI.esc(item.imageUrl)}" alt="Current photo" />
        <span class="badge badge-glass" style="position:absolute;bottom:8px;left:8px">Current photo</span>`;
    }
  }

  async function loadForEdit() {
    try {
      const data = await FindIt.api.get(`/items/${editId}`);
      if (!data.item.isOwner) {
        UI.showAlert(alertBox, 'You can only edit reports that you created.', 'error');
        form.querySelectorAll('input, select, textarea, button').forEach((el) => {
          el.disabled = true;
        });
        return;
      }
      editing = data.item;
      type = editing.type;
      typeTabs.classList.add('hidden');
      applyType();
      fillForm(editing);
      document.getElementById('dateLostFound').max = UI.todayISO();
    } catch (err) {
      UI.showAlert(alertBox, err.message, 'error');
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    UI.clearAlert(alertBox);
    if (!validate()) {
      UI.showAlert(alertBox, 'Please fix the highlighted fields and try again.', 'error');
      form.querySelector('.has-error input, .has-error select, .has-error textarea')?.focus();
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    ['title', 'category', 'description', 'dateLostFound', 'location', 'contactEmail', 'contactPhone'].forEach(
      (field) => formData.append(field, document.getElementById(field).value.trim())
    );
    const file = document.getElementById('image').files[0];
    if (file) formData.append('image', file);

    UI.setLoading(submitBtn, true, editing ? 'Saving…' : 'Submitting…');
    try {
      const data = editing
        ? await FindIt.api.patchForm(`/items/${editing.id}`, formData)
        : await FindIt.api.postForm('/items', formData);

      UI.showAlert(alertBox, data.message || 'Report submitted successfully.', 'success');
      UI.toast(data.message || 'Report submitted!', 'success');
      form.querySelectorAll('input, select, textarea').forEach((el) => {
        if (el.type !== 'file') el.value = '';
      });
      setTimeout(() => {
        window.location.href = `/item.html?id=${data.item.id}`;
      }, 900);
    } catch (err) {
      UI.showAlert(alertBox, err.message, 'error');
      UI.setLoading(submitBtn, false);
    }
  }

  function wire() {
    typeTabs.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        if (editing) return;
        type = tab.dataset.type;
        applyType();
        const url = new URL(window.location.href);
        url.searchParams.set('type', type);
        window.history.replaceState({}, '', url);
      });
    });

    document.getElementById('dateLostFound').max = UI.todayISO();
    document.getElementById('dateLostFound').value = UI.todayISO();
    UI.bindImagePreview(document.getElementById('image'), document.getElementById('imagePreview'));
    form.addEventListener('submit', onSubmit);

    document.querySelectorAll('#itemForm .input, #itemForm .select, #itemForm .textarea').forEach((field) => {
      field.addEventListener('input', () => UI.fieldError(field, ''));
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    applyType();
    wire();

    // wait for the session check from layout.js before guarding the page
    await FindIt.session.ready;
    if (!FindIt.session.isLoggedIn()) {
      FindIt.session.requireLogin('Please log in to report an item.');
      return;
    }

    const email = document.getElementById('contactEmail');
    if (!email.value && FindIt.session.user) email.value = FindIt.session.user.email;
    const phone = document.getElementById('contactPhone');
    if (!phone.value && FindIt.session.user && FindIt.session.user.phone) {
      phone.value = FindIt.session.user.phone;
    }

    if (editId) await loadForEdit();
  });
})();
