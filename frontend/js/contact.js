/* Contact page: sends a message to the FindIt team */
(function () {
  const form = document.getElementById('contactForm');
  const alertBox = document.getElementById('contactAlert');

  document.addEventListener('DOMContentLoaded', async () => {
    await FindIt.session.ready;
    if (FindIt.session.user) {
      document.getElementById('name').value = FindIt.session.user.name || '';
      document.getElementById('email').value = FindIt.session.user.email || '';
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    UI.clearAlert(alertBox);
    UI.clearFormErrors(form);

    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const subject = document.getElementById('subject');
    const message = document.getElementById('message');

    let valid = true;
    if (name.value.trim().length < 2) {
      UI.fieldError(name, 'Please enter your name.');
      valid = false;
    }
    if (!UI.isEmail(email.value)) {
      UI.fieldError(email, 'Please enter a valid email address.');
      valid = false;
    }
    if (!subject.value) {
      UI.fieldError(subject, 'Please choose a topic.');
      valid = false;
    }
    if (message.value.trim().length < 10) {
      UI.fieldError(message, 'Please write at least 10 characters.');
      valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('contactSubmit');
    UI.setLoading(btn, true, 'Sending…');
    try {
      const data = await FindIt.api.post('/contact', {
        name: name.value.trim(),
        email: email.value.trim(),
        subject: subject.value,
        message: message.value.trim(),
      });
      UI.showAlert(alertBox, data.message, 'success');
      UI.toast('Message sent. Thank you!', 'success');
      form.reset();
      if (FindIt.session.user) {
        document.getElementById('name').value = FindIt.session.user.name || '';
        document.getElementById('email').value = FindIt.session.user.email || '';
      }
    } catch (err) {
      UI.showAlert(alertBox, err.message, 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
})();
