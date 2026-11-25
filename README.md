# FindIt — Lost &amp; Found Portal

A complete, working lost-and-found website for a college or university campus.
Students and staff can report lost items, post found items, search and filter the
listings, claim an item with proof of ownership, and get notified at every step.
Administrators get their own dashboard to moderate reports, manage accounts and
keep the portal trustworthy.

Built with **HTML5, CSS3, vanilla JavaScript, Node.js, Express.js and MongoDB
(Mongoose)**, with JWT authentication and password hashing.

---

## 1. Highlights

**Public site**
- Modern landing page with hero search, live statistics and the latest lost/found reports
- Browse page with keyword search plus category, status, location and date-range filters
- Item detail page with photo lightbox, masked contact details and safety guidance
- Fully responsive (mobile, tablet, desktop) with a navy / white / light-blue design system

**Accounts**
- Student / staff registration and login, admin-only login
- Forgot password + reset link (token hashed and time limited)
- Profile management and password change
- Signed HTTP-only JWT cookie sessions, bcrypt password hashing

**Items**
- Report lost item and report found item forms with image upload and preview
- Edit and delete your own reports, mark an item as returned
- 8 categories: Electronics, Books, ID Cards, Wallets, Keys, Bags, Accessories, Other
- Contact details masked for guests, unlocked for logged-in users (reporter is notified)

**Claims**
- Submit a claim with a message, proof of ownership and an optional photo
- The person who reported the item accepts or rejects the claim
- Accepting a claim marks the item returned and closes the other pending claims
- Notifications for claim submitted / accepted / rejected

**Admin**
- Statistics overview (reports, active listings, returned, users, claims, flags, success rate)
- Approval queue, approve / reject / remove / delete any listing
- User management (block, unblock, change role, delete)
- Claim overview, flagged-listing moderation, contact-form inbox

**Extras**
- In-app notification bell with unread badge
- Toasts and inline success / error messages everywhere
- Suspicious-listing reporting, admin approval flow, privacy masking
- Server-side validation on every endpoint plus client-side form validation

---

## 2. Project structure

```
findit/
├── README.md
├── package.json                 # convenience scripts (install / start / seed)
├── backend/
│   ├── server.js                # Express app, middleware, static hosting
│   ├── package.json
│   ├── .env.example             # copy to .env and edit
│   ├── .env                     # ready-to-run defaults (file-store mode)
│   ├── config/
│   │   └── db.js                # MongoDB (Mongoose) or JSON file-store driver
│   ├── lib/
│   │   ├── db.js                # tiny data-access layer used by all routes
│   │   └── jsonstore.js         # zero-setup JSON database fallback
│   ├── models/                  # Mongoose schemas
│   │   ├── user.js  item.js  claim.js  notification.js  report.js  contact.js
│   ├── middleware/
│   │   ├── auth.js              # JWT sign/verify, requireAuth, requireAdmin
│   │   └── upload.js            # multer image upload (JPG/PNG/WEBP/GIF, 5 MB)
│   ├── routes/
│   │   ├── auth.js  items.js  claims.js  users.js
│   │   └── notifications.js  admin.js  contact.js  stats.js
│   ├── utils/
│   │   ├── helpers.js           # serialisers, privacy masking, async wrapper
│   │   ├── validate.js          # server-side validation rules
│   │   ├── notify.js            # notification helpers
│   │   └── seedData.js          # demo users, items, claims, notifications
│   ├── scripts/seed.js          # npm run seed / npm run seed:reset
│   ├── data/db.json             # created automatically in file-store mode
│   └── uploads/                 # uploaded item photos (+ uploads/seed demo photos)
└── frontend/
    ├── index.html               # homepage
    ├── browse.html              # search + filters
    ├── item.html                # item details, claim, contact
    ├── report.html              # report lost / found (also used for editing)
    ├── dashboard.html           # user dashboard
    ├── profile.html             # profile + password
    ├── admin.html               # admin dashboard
    ├── login.html  register.html  forgot-password.html
    ├── contact.html 404.html
    ├── css/styles.css           # complete design system
    └── js/
        ├── api.js               # fetch wrapper + session helpers
        ├── ui.js                # icons, cards, toasts, modals, formatting
        ├── layout.js            # shared navbar, notification bell, footer
        ├── home.js  browse.js  item.js  report.js
        ├── auth.js  dashboard.js  profile.js  admin.js  contact.js
```

---

## 3. Run it locally

### Requirements
- Node.js **18 or newer** (20 recommended) — `node -v`
- MongoDB **6+** locally, or a free MongoDB Atlas cluster *(optional — see the note below)*

### Step 1 — install dependencies

```bash
cd findit/backend
npm install
```

*(or from the project root: `npm install`, which installs the backend packages for you)*

### Step 2 — configure the environment

```bash
cd backend
cp .env.example .env      # Windows: copy .env.example .env
```

A ready-to-run `.env` is already included (file-store mode, so it works without
MongoDB). Open it and adjust:

| Variable | What it does |
| --- | --- |
| `PORT` | Port the server listens on (default `5000`) |
| `MONGODB_URI` | MongoDB connection string. **Leave empty** to use the built-in JSON file store |
| `JWT_SECRET` | Long random string used to sign session cookies — change it |
| `JWT_EXPIRES_DAYS` | Session lifetime in days (default `7`) |
| `ADMIN_EMAILS` | Comma-separated emails allowed to register as admin |
| `AUTO_APPROVE_ITEMS` | `true` = reports go live immediately, `false` = every report needs admin approval |
| `SEED_ON_EMPTY` | `true` = create demo data the first time the database is empty |
| `MAX_UPLOAD_MB` | Maximum image upload size (default `5`) |
| `NODE_ENV` | `development` locally, `production` when deployed |

**MongoDB connection strings**

```env
# local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/findit

# MongoDB Atlas (replace user, password and cluster host)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/findit
```

> **No MongoDB installed?** Leave `MONGODB_URI` empty. The app then stores
> everything in `backend/data/db.json` using the same data-access layer, so every
> feature works out of the box. Set the URI whenever you want real MongoDB — no
> code changes needed.

### Step 3 — (optional) seed demo data

```bash
npm run seed          # only seeds when the database is empty
npm run seed:reset    # wipes everything and seeds fresh demo data
```

Demo data is also created automatically on first start when `SEED_ON_EMPTY=true`.

### Step 4 — start the server

```bash
npm start             # or: npm run dev  (auto-restart on file changes)
```

Open **http://localhost:5000** — the frontend is served by the same Express app,
so there is no second server and no CORS setup.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@findit.edu` | `Admin@123` |
| Student | `akhil@findit.edu` | `Student@123` |
| Student | `priya@findit.edu` | `Student@123` |
| Staff | `librarian@findit.edu` | `Staff@123` |

Admin login page: **http://localhost:5000/login.html?admin=1**

---

## 4. How the main flows work

**Report an item** — log in → *Report Lost* / *Report Found* → fill the form
(name, category, description, date, location, optional photo, contact details) →
submit. With `AUTO_APPROVE_ITEMS=true` the listing is live instantly, otherwise it
waits in the admin approval queue.

**Search** — `/browse.html` supports `q` (keyword across title, description,
location and category), `category`, `type` (`lost`/`found`), `location`, `from`
and `to` (date range), `sort` (`newest`, `oldest`, `date`, `views`) and `page`.
All state is kept in the URL, so filtered views can be shared.

**Claim an item** — open a listing → *Claim this item* → describe the item and
give proof of ownership (plus an optional photo). The reporter sees the request
in *Dashboard → Claim requests* and accepts or rejects it with a note.
Accepting marks the item as **returned** and automatically rejects the other
pending claims; the claimant gets a notification either way.

**Contact privacy** — guests see masked contact details (`a***@gmail.com`).
A logged-in user presses *Contact reporter*, which unlocks the details and sends
the reporter a notification. Only the owner and admins always see full details.

**Admin moderation** — `/admin.html` gives you statistics, the full item table
with approve / reject / remove / delete, user management, all claims, flagged
listings and the contact inbox. Admins can also open any listing that is hidden
from the public.

---

## 5. API reference

All endpoints live under `/api`. Authentication uses a signed HTTP-only cookie
(`findit_token`); a `Bearer <token>` header also works for API clients.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | – | Create an account and log in |
| POST | `/auth/login` | – | Log in |
| POST | `/auth/admin/login` | – | Log in (admins only) |
| POST | `/auth/logout` | – | Clear the session cookie |
| GET | `/auth/me` | optional | Current user + unread notification count |
| POST | `/auth/forgot-password` | – | Create a reset token (link logged / returned in dev) |
| POST | `/auth/reset-password` | – | Set a new password with a token |
| PATCH | `/auth/password` | user | Change password |
| GET | `/items` | optional | List / search / filter items (paginated) |
| GET | `/items/recent` | optional | Latest lost and found items |
| GET | `/items/categories` | – | Category list |
| GET | `/items/:id` | optional | Item detail (also returns your claim, if any) |
| POST | `/items` | user | Create a report (multipart, `image` field) |
| PATCH | `/items/:id` | owner/admin | Update a report |
| DELETE | `/items/:id` | owner/admin | Delete a report and its claims |
| PATCH | `/items/:id/returned` | owner/admin | Mark as returned |
| POST | `/items/:id/contact` | user | Unlock contact details + notify the reporter |
| POST | `/items/:id/report` | optional | Flag a suspicious listing |
| POST | `/claims` | user | Submit a claim (`proofImage` optional) |
| GET | `/claims/mine` | user | Claims you submitted |
| GET | `/claims/received` | user | Claims on the items you reported |
| PATCH | `/claims/:id/accept` | item owner/admin | Accept a claim |
| PATCH | `/claims/:id/reject` | item owner/admin | Reject a claim |
| DELETE | `/claims/:id` | claimant | Withdraw a pending claim |
| GET | `/users/me` | user | Profile + personal statistics |
| PATCH | `/users/me` | user | Update name, phone, ID, department |
| GET | `/users/me/items` | user | Your reports (`?type=lost\|found`) |
| GET | `/notifications` | user | Notifications + unread count |
| PATCH | `/notifications/read-all` | user | Mark all as read |
| PATCH | `/notifications/:id/read` | user | Mark one as read |
| DELETE | `/notifications/:id` | user | Delete a notification |
| GET | `/stats` | – | Public homepage statistics |
| POST | `/contact` | – | Contact form submission |
| GET | `/admin/stats` | admin | Dashboard statistics |
| GET | `/admin/items` | admin | All items (`?status=`, `?type=`, `?q=`) |
| PATCH | `/admin/items/:id/status` | admin | Approve / reject / remove / return |
| DELETE | `/admin/items/:id` | admin | Delete any listing |
| GET | `/admin/users` | admin | User list (`?q=`, `?role=`, `?status=`) |
| PATCH | `/admin/users/:id` | admin | Change role or block / unblock |
| DELETE | `/admin/users/:id` | admin | Delete a user and their data |
| GET | `/admin/claims` | admin | All claims (`?status=`) |
| GET | `/admin/reports` | admin | Flagged listings (`?status=`) |
| PATCH | `/admin/reports/:id` | admin | Mark a flag resolved |
| GET | `/admin/messages` | admin | Contact-form messages |
| PATCH | `/admin/messages/:id` | admin | Mark a message as read |

---

## 6. Security notes

- Passwords are hashed with **bcrypt** (10 rounds) and never returned by the API.
- Sessions are **JWTs in HTTP-only, SameSite=Lax cookies** (`secure` in production),
  so the token is not reachable from JavaScript.
- Every write endpoint validates input server-side; regex search terms are escaped.
- Uploads are restricted to JPG/PNG/WEBP/GIF, renamed with a random name and size limited.
- Contact details are masked for guests; ownership and role checks guard every
  edit, delete, claim decision and admin route.
- `express-rate-limit` throttles the API (stricter on auth routes) and `helmet`
  sets safe HTTP headers.
- Change `JWT_SECRET` before deploying, and set `NODE_ENV=production`.

**Known limitations of this student project**
- No mail server is configured, so the forgot-password link is printed in the
  terminal and returned in the API response while `NODE_ENV=development`.
  Plug in Nodemailer to send real emails.
- The JSON file store is meant for demos and single-user testing; use MongoDB for
  real deployments.

---

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| `EADDRINUSE` on start | Another process uses the port — change `PORT` in `.env` |
| `MongoServerError: bad auth` | Check the username/password in `MONGODB_URI` (URL-encode special characters) |
| `[db] MongoDB unavailable … falling back` | MongoDB is not running; the app continues with the JSON file store |
| Images not showing | Make sure `backend/uploads/` exists and is writable |
| Empty homepage | Run `npm run seed` (or delete `backend/data/db.json` and restart) |
| Login says session expired | `JWT_SECRET` changed after the cookie was issued — log in again |
| Want to reset everything | `npm run seed:reset` (JSON store: also delete `backend/data/db.json`) |

---

## 8. Deploying

1. Set `NODE_ENV=production`, a strong `JWT_SECRET` and your `MONGODB_URI`.
2. Run `npm install --omit=dev` in `backend/`, then `npm start`.
3. Put the app behind HTTPS (Render, Railway, Fly.io, an EC2 VPS with Nginx, …).
   Cookies become `secure` automatically in production.
4. Make sure the `uploads/` folder is on persistent storage (or swap in S3/Cloudinary).

---

## 9. License

Released under the MIT License — free to use for coursework and campus projects.
