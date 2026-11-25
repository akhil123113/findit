/* Auth pages: login (student + admin), registration, forgot/reset password */
(function () {
  const page = document.body.dataset.page;
  const alertBox = document.getElementById('authAlert');

  function bindPasswordToggles() {
    document.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.toggle);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = show
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
               <path d="M3 3l18 18"/><path d="M10.6 6.1A9.9 9.9 0 0112 6c6.4 0 10 6 10 6a17 17 0 01-3 3.6M6.5 7.7A16.7 16.7 0 002 12s3.6 6.5 10 6.5c1.2 0 2.3-.2 3.3-.6"/>
               <path d="M9.9 9.9a3 3 0 004.2 4.2"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
               <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });
  }

  function nextUrl(fallback = '/dashboard.html') {
    const next = UI.qs('next');
    if (next && next.startsWith('/')) return next;
    return fallback;
  }

  /* --------------------------------- login --------------------------------- */
  function initLogin() {
    const adminMode = UI.qs('admin') === '1';
    const form = document.getElementById('loginForm');
    const submit = document.getElementById('loginSubmit');

    if (adminMode) {
      document.getElementById('authHeading').textContent = 'Administrator login';
      document.getElementById('authSub').textContent = 'Sign in with your administrator account to manage the portal.';
      submit.textContent = 'Log in as administrator';
      document.getElementById('adminLink').textContent = '← Student / staff login';
      document.getElementById('adminLink').href = '/login.html';
      document.title = 'Administrator login — FindIt';
      document.querySelector('.demo-box').style.display = 'none';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearAlert(alertBox);
      UI.clearFormErrors(form);

      const email = document.getElementById('email');
      const password = document.getElementById('password');
      let valid = true;
      if (!UI.isEmail(email.value)) {
        UI.fieldError(email, 'Please enter a valid email address.');
        valid = false;
      }
      if (password.value.length < 1) {
        UI.fieldError(password, 'Please enter your password.');
        valid = false;
      }
      if (!valid) return;

      UI.setLoading(submit, true, 'Signing in…');
      try {
        const data = await FindIt.session.login(email.value.trim(), password.value, adminMode);
        UI.toast(data.message || 'Logged in successfully.', 'success', 2200);
        const fallback = adminMode || data.user.role === 'admin' ? '/admin.html' : '/dashboard.html';
        setTimeout(() => {
          window.location.href = nextUrl(fallback);
        }, 500);
      } catch (err) {
        UI.showAlert(alertBox, err.message, 'error');
        UI.setLoading(submit, false);
      }
    });
  }

  /* -------------------------------- register ------------------------------- */
  function initRegister() {
    const form = document.getElementById('registerForm');
    const submit = document.getElementById('registerSubmit');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearAlert(alertBox);
      UI.clearFormErrors(form);

      const value = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        studentId: document.getElementById('studentId').value.trim(),
        department: document.getElementById('department').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        role: document.getElementById('role').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
      };

      let valid = true;
      if (value.name.length < 2) {
        UI.fieldError(document.getElementById('name'), 'Please enter your full name.');
        valid = false;
      }
      if (!UI.isEmail(value.email)) {
        UI.fieldError(document.getElementById('email'), 'Please enter a valid email address.');
        valid = false;
      }
      if (value.password.length < 6) {
        UI.fieldError(document.getElementById('password'), 'Password must be at least 6 characters.');
        valid = false;
      }
      if (value.password !== value.confirmPassword) {
        UI.fieldError(document.getElementById('confirmPassword'), 'Passwords do not match.');
        valid = false;
      }
      if (!document.getElementById('terms').checked) {
        UI.showAlert(alertBox, 'Please accept the usage terms to continue.', 'warning');
        valid = false;
      }
      if (!valid) return;

      UI.setLoading(submit, true, 'Creating account…');
      try {
        const data = await FindIt.session.register(value);
        UI.toast(`Welcome to FindIt, ${UI.firstName(data.user.name)}!`, 'success', 2400);
        setTimeout(() => {
          window.location.href = nextUrl('/dashboard.html');
        }, 700);
      } catch (err) {
        UI.showAlert(alertBox, err.message, 'error');
        UI.setLoading(submit, false);
      }
    });
  }

  /* ----------------------------- forgot password --------------------------- */
  function initForgot() {
    const token = UI.qs('token');
    const forgotForm = document.getElementById('forgotForm');
    const resetForm = document.getElementById('resetForm');
    const devBox = document.getElementById('devLinkBox');

    if (token) {
      document.getElementById('forgotHeading').textContent = 'Set a new password';
      document.getElementById('forgotSub').textContent = 'Choose a strong password you have not used before.';
      forgotForm.classList.add('hidden');
      resetForm.classList.remove('hidden');
    }

    forgotForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearAlert(alertBox);
      const email = document.getElementById('email');
      if (!UI.isEmail(email.value)) {
        UI.fieldError(email, 'Please enter a valid email address.');
        return;
      }
      const submit = document.getElementById('forgotSubmit');
      UI.setLoading(submit, true, 'Sending…');
      try {
        const data = await FindIt.api.post('/auth/forgot-password', { email: email.value.trim() });
        UI.showAlert(alertBox, data.message, 'success');
        if (data.devResetUrl) {
          devBox.classList.remove('hidden');
          devBox.innerHTML = `${UI.icon('info')}
            <div><strong>Development mode:</strong> no mail server is configured, so use this
            link to continue.<br /><a href="${UI.esc(data.devResetUrl)}">Open the reset link</a></div>`;
        }
      } catch (err) {
        UI.showAlert(alertBox, err.message, 'error');
      } finally {
        UI.setLoading(submit, false);
      }
    });

    resetForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearAlert(alertBox);
      UI.clearFormErrors(resetForm);
      const password = document.getElementById('password');
      const confirm = document.getElementById('confirmPassword');
      let valid = true;
      if (password.value.length < 6) {
        UI.fieldError(password, 'Password must be at least 6 characters.');
        valid = false;
      }
      if (password.value !== confirm.value) {
        UI.fieldError(confirm, 'Passwords do not match.');
        valid = false;
      }
      if (!valid) return;

      const submit = document.getElementById('resetSubmit');
      UI.setLoading(submit, true, 'Updating…');
      try {
        const data = await FindIt.api.post('/auth/reset-password', {
          token,
          password: password.value,
          confirmPassword: confirm.value,
        });
        UI.showAlert(alertBox, data.message, 'success');
        UI.toast('Password updated. Redirecting to login…', 'success', 2400);
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1400);
      } catch (err) {
        UI.showAlert(alertBox, err.message, 'error');
        UI.setLoading(submit, false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindPasswordToggles();
    if (page === 'login') initLogin();
    if (page === 'register') initRegister();
    if (page === 'forgot') initForgot();
  });
})();
