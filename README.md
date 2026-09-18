# 🎓 Tutorify — Smart Tutoring Platform

**Tutorify** is a fullstack web platform connecting students with qualified tutors.
Built with Node.js/Express on the backend and modern vanilla JavaScript on the frontend, it provides an engaging experience for exploring tutor profiles, managing learning sessions, and accessing an interactive admin dashboard.

---

## 🚀 Key Features

- 🔐 **Dual-Role Authentication System** — Role-based access control (User and Admin) with bcrypt password hashing and JWT token authentication.
- 🧑‍🏫 **Course Directory** — Dynamic catalog fetching courses from the backend API.
- 📩 **Contact & Messaging System** — Asynchronous contact form submission with admin message management.
- 📊 **Admin Dashboard** — Live platform analytics, profile views tracking, and customer management.
- ♿ **Accessible & Responsive Design** — Screen-reader labels (`.sr-only`), ARIA attributes, keyboard navigation (`:focus-visible`), and adaptive layouts.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js, JSON File DB, JWT (`jsonwebtoken`), `bcryptjs`, CORS
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Ionicons, Unicons
- **Package Manager:** `pnpm`

---

## ⚙️ Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Run test suite
pnpm test

# 3. Start the server
pnpm start
```

The server will run at `http://localhost:3000`.

### Default Admin Credentials
- **Email:** `admin@tutorify.com`
- **Password:** `password123`

---

## 📄 API Endpoints

- `POST /api/register` — Register a new user account (role: `user`).
- `POST /api/login` — Authenticate user/admin and issue JWT token.
- `GET /api/courses` — Retrieve available course listings.
- `POST /api/courses` — Add a new course (Admin authenticated).
- `POST /api/contact` — Submit a message via the contact form.
- `POST /api/stats/view` — Record a page view count.
- `GET /api/stats` — Retrieve admin dashboard metrics (Admin authenticated).

---

## 🌍 License

Licensed under the MIT License.
