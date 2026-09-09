# 🎓 Tutorify — Smart Tutoring Platform

**Tutorify** is a modern web-based platform designed to connect **students** and **tutors** through an elegant and interactive user interface.
Built with **HTML, CSS, JavaScript, and Node.js/Express**, it provides an engaging experience for exploring tutor profiles, enrolling in courses, managing learning sessions, and navigating a sleek admin dashboard layout.

---

## 🚀 Features

- 🧑‍🏫 **Tutor & Course Profiles** — Beautiful layout for showcasing courses, instructors, and learning tracks.
- 🔐 **Authentication System** — Dual-role authentication (User & Admin) backed by JWT tokens and hashed passwords.
- 📊 **Admin Dashboard** — Real-time metrics tracking profile views, course tutorials, received contact inquiries, and platform statistics.
- 💬 **Contact Form & Messages** — Fully interactive, async contact submission with status indicators.
- 📱 **Responsive & Accessible Design** — Adaptive layout, keyboard navigation support (`:focus-visible`), and screen reader friendly (`.sr-only`, `aria-label`).

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+ Vanilla)
- **Backend:** Node.js, Express.js
- **Data Persistence:** JSON-based persistent datastore with in-memory caching and queued async writes
- **Security:** `bcryptjs` for password hashing, `jsonwebtoken` (JWT) for session authorization

---

## ⚙️ How to Run

```bash
# Install dependencies
pnpm install

# Start the application server
pnpm start
# Server runs on http://localhost:3000
```

---

## 👨‍💻 Developer & License

Created by **Fikiretsion Tasew**. Licensed under the [MIT License](LICENSE).
