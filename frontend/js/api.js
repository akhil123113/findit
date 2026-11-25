/* ==========================================================================
   FindIt - API client
   Thin wrapper around fetch: JSON + multipart, cookies, friendly errors.
   ========================================================================== */

const FindIt = window.FindIt || {};
window.FindIt = FindIt;

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload || {};
  }
}

async function request(path, { method = 'GET', body, form, headers = {} } = {}) {
  const options = {
    method,
    credentials: 'same-origin',
    headers: { ...headers },
  };

  if (form) {
    options.body = form; // browser sets the multipart boundary
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch (err) {
    throw new ApiError('Cannot reach the server. Please check your connection.', 0);
  }

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const message = data.error || `Request failed (${response.status}).`;
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('findit:unauthorized', { detail: { path } }));
    }
    throw new ApiError(message, response.status, data);
  }

  return data;
}

const api = {
  request,
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  postForm: (path, form) => request(path, { method: 'POST', form }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  patchForm: (path, form) => request(path, { method: 'PATCH', form }),
  del: (path) => request(path, { method: 'DELETE' }),
};

FindIt.api = api;
FindIt.ApiError = ApiError;

/* ------------------------------ auth helpers ------------------------------ */
FindIt.session = {
  user: null,
  unread: 0,

  async load() {
    try {
      const data = await api.get('/auth/me');
      this.user = data.user || null;
      this.unread = data.unreadNotifications || 0;
    } catch (_err) {
      this.user = null;
      this.unread = 0;
    }
    return this.user;
  },

  isLoggedIn() {
    return Boolean(this.user);
  },

  isAdmin() {
    return Boolean(this.user && this.user.role === 'admin');
  },

  async login(email, password, adminOnly = false) {
    const data = await api.post(adminOnly ? '/auth/admin/login' : '/auth/login', {
      email,
      password,
    });
    this.user = data.user;
    return data;
  },

  async register(payload) {
    const data = await api.post('/auth/register', payload);
    this.user = data.user;
    return data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (_err) {
      /* ignore */
    }
    this.user = null;
    this.unread = 0;
  },

  /** Sends the visitor to the login page, remembering where they came from. */
  requireLogin(message) {
    if (this.isLoggedIn()) return true;
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    if (message) {
      try {
        sessionStorage.setItem('findit:flash', message);
      } catch (_err) {
        /* ignore */
      }
    }
    window.location.href = `/login.html?next=${next}`;
    return false;
  },
};
