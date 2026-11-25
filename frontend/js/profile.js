/* Profile page: personal details + password change */
(function () {
  const profileAlert = document.getElementById('profileAlert');
  const passwordAlert = document.getElementById('passwordAlert');

  function fill(profile) {
    const { user, stats } = profile;
    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('studentId').value = user.studentId || '';
    document.getElementById('department').value = user.department || '';
    document.getElementById('phone').value = user.phone || '';

    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileRole').textContent = user.role;
    document.getElementById('profileAvatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
    document.getElementById('profileJoined').textContent = UI.formatDate(user.createdAt);
    document.getElementById('profileLost').textContent = stats.lostCount || 0;
    document.getElementById('profileFound').textContent = stats.foundCount || 0;
    document.getElementById('profileReturned').textContent = stats.returnedCount || 0;
  }

  function wire() {
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearAlert(profileAlert);
      UI.clearFormErrors(profileForm);

      const name = document.getElementById('name');
      if (name.value.trim().length < 2) {
        UI.fieldError(name, 'Please enter your full name.');
        return;
      }

      const btn = document.getElementById('saveProfile');
      UI.setLoading(btn, true, 'Saving…');
      try {
        const data = await FindIt.api.patch('/users/me', {
          name: name.value.trim(),
          phone: document.getElementById('phone').value.trim(),
          studentId: document.getElementById('studentId').value.trim(),
          department: document.getElementById('department').value.trim(),
        });
        FindIt.session.user = data.user;
        if (FindIt.layout) FindIt.layout.renderAuthState();
        document.getElementById('profileName').textContent = data.user.name;
        document.getElementById('profileAvatar').textContent = data.user.name.charAt(0).toUpperCase();
        UI.showAlert(profileAlert, data.message, 'success');
        UI.toast('Profile updated.', 'success');
      } catch (err) {
        UI.showAlert(profileAlert, err.message, 'error');
      } finally {
        UI.setLoading(btn, false);
      }
    });

    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearAlert(passwordAlert);
      UI.clearFormErrors(passwordForm);

      const current = document.getElementById('currentPassword');
      const next = document.getElementById('newPassword');
      const confirm = document.getElementById('confirmNewPassword');
      let valid = true;
      if (!current.value) {
        UI.fieldError(current, 'Please enter your current password.');
        valid = false;
      }
      if (next.value.length < 6) {
        UI.fieldError(next, 'Password must be at least 6 characters.');
        valid = false;
      }
      if (next.value !== confirm.value) {
        UI.fieldError(confirm, 'Passwords do not match.');
        valid = false;
      }
      if (!valid) return;

      const btn = document.getElementById('savePassword');
      UI.setLoading(btn, true, 'Updating…');
      try {
        const data = await FindIt.api.patch('/auth/password', {
          currentPassword: current.value,
          newPassword: next.value,
        });
        UI.showAlert(passwordAlert, data.message, 'success');
        UI.toast('Password changed.', 'success');
        passwordForm.reset();
      } catch (err) {
        UI.showAlert(passwordAlert, err.message, 'error');
      } finally {
        UI.setLoading(btn, false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await FindIt.session.ready;
    if (!FindIt.session.isLoggedIn()) {
      FindIt.session.requireLogin('Please log in to view your profile.');
      return;
    }
    wire();
    try {
      const profile = await FindIt.api.get('/users/me');
      fill(profile);
    } catch (err) {
      UI.showAlert(profileAlert, err.message, 'error');
    }
  });
})();
