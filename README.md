# 🎓 Tutorify Pro — Ultimate Social Learning Platform

Tutorify is a high-engagement, full-stack educational ecosystem that combines the best features of **Duolingo**, **YouTube**, and **Coursera**. It features a modular Node.js backend, a responsive frontend, and an integrated AI assistant.

---

## 🚀 Key Features

- **🔥 Gamification (Duolingo Style)**:
  - **Daily Streaks**: Maintain your learning momentum with a flame streak system.
  - **XP & Leaderboards**: Earn XP for completing lessons and compete with others.
  - **Streak Shields**: Protect your progress by spending XP on "Streak Freeze" shields.
  - **Tut the Owl**: A playful, engaging AI mascot that nudges you to stay consistent.

- **🎥 Creator Tools (YouTube Studio Style)**:
  - **Studio Wizard**: A multi-step upload flow for teachers (Metadata -> Thumbnail -> Curriculum -> Visibility).
  - **Social Interaction**: Real-time likes and comments on every lesson.
  - **Trending Feed**: Discover the most popular and recommended courses on the homepage.

- **📚 Professional Learning**:
  - **Course Player**: A distraction-free environment for navigating multi-lesson courses.
  - **Progress Tracking**: Automatic lesson completion tracking with visual progress bars.
  - **Certificates**: Generate professional PDF-style certificates upon course completion.

- **🤖 Smart AI & Personalization**:
  - **Contextual AI Agent**: 'Tut the Owl' knows the site content and provides personalized advice.
  - **Onboarding**: A custom flow to set your nickname and learning interests.
  - **Multilingual Support**: Fully localized in English, Amharic, Oromo, Tigrinya, Spanish, and French.

---

## 📁 Project Structure

```text
Tutorify/
├── client/                # Frontend Assets
│   ├── css/               # Stylesheets (style.css, motivation.css, etc.)
│   ├── js/                # Client-side Logic (main.js, motivation.js, etc.)
│   ├── locales/           # i18n Translation Files
│   └── *.html             # UI Pages
├── server/                # Backend Source
│   ├── controllers/       # Business Logic (Auth, Course, Chat)
│   ├── routes/            # API Endpoints
│   ├── services/          # Modular Services (User, Course)
│   ├── middleware/        # Security & Auth (JWT, Role Checks)
│   ├── models/            # Data Access Layer
│   └── data/              # Database (db.json)
├── index_content.js       # AI Knowledge Indexer
├── package.json           # Dependencies & Scripts
└── .env.example           # Environment Template
```

---

## ⚙️ How to Run

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **NPM**

### 2. Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and set your JWT_SECRET
```

### 3. Start the Server
```bash
npm start
```
The application will be available at `http://localhost:3000`.

> **Note**: Do not open `.html` files directly in your browser. They require the backend server to handle API requests and security.

---

## 🛡️ Security
- **JWT Authentication**: Secure sessions with JSON Web Tokens.
- **RBAC**: Role-Based Access Control (Admin, Teacher, Student).
- **Hardened**: Protected by Helmet (headers), CORS, and Rate-Limiting.
- **Bcrypt**: Industrial-grade password hashing.

---

## 👨‍💻 Developer
**Fikiretsion Tasew**
Building the next generation of intelligent educational platforms.

---
🪪 **License**: MIT
🌟 **Support**: Give us a ⭐ on GitHub if you find this project useful!
