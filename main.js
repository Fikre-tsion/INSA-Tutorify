// Centralized Auth & Utility functions
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  recordPageView();
  loadDynamicCourses();
});

function updateAuthUI() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const authLink = document.getElementById('auth-link');

  if (authLink) {
    if (token && user) {
      authLink.innerHTML = `<a href="#" onclick="logoutUser(event)">${escapeHTML(user.name)} (Logout)</a>`;
    } else {
      authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
  }
}

function logoutUser(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function recordPageView() {
  fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

async function loadDynamicCourses() {
  const container = document.querySelector('.courses__container');
  const path = window.location.pathname;
  if (!container || path.includes('index.html') || path === '/' || path.endsWith('/')) return;

  try {
    const res = await fetch('/api/courses');
    if (!res.ok) return;
    const courses = await res.json();
    if (courses && courses.length > 0) {
      container.innerHTML = courses.map(course => `
        <article class="course">
          <div class="course__image">
            <img src="${escapeHTML(course.image || './digitalmarketing.png')}" alt="${escapeHTML(course.title)}">
          </div>
          <div class="course__info">
            <h4>${escapeHTML(course.title)}</h4>
            <p>${escapeHTML(course.description)}</p>
            <a href="courses.html" class="btn btn-primary">Learn More</a>
          </div>
        </article>
      `).join('');
    }
  } catch (err) {
    console.warn('Could not load dynamic courses, using static fallbacks.');
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

//changing navbar style when scrolling
let navElement = null;
window.addEventListener('scroll', () => {
  if (!navElement) navElement = document.querySelector('nav');
  if (navElement) {
    navElement.classList.toggle('window-scroll', window.scrollY > 0);
  }
}, { passive: true });

//show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
  faq.addEventListener('click', () => {
    faq.classList.toggle('open');
    const icon = faq.querySelector('.faq_icon i');
    if (icon) {
      icon.className = icon.className === 'uil uil-plus' ? 'uil uil-minus' : 'uil uil-plus';
    }
  });
});

//show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && menu && closeBtn) {
  menuBtn.addEventListener('click', () => {
    menu.style.display = "flex";
    closeBtn.style.display = "inline-block";
    menuBtn.style.display = "none";
  });

  const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
  };

  closeBtn.addEventListener('click', closeNav);
}
