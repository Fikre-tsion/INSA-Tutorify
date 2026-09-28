// Lazy-cached scroll event listener for navbar styling
let navElement = null;
window.addEventListener('scroll', () => {
    if (!navElement) navElement = document.querySelector('nav');
    if (navElement) {
        navElement.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Show/hide FAQ answer toggle
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            if (icon.className === 'uil uil-plus') {
                icon.className = 'uil uil-minus';
            } else {
                icon.className = 'uil uil-plus';
            }
        }
    });
});

// Show/hide nav menu for mobile screens
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

// XSS Sanitization helper function
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Centralized Auth UI management
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let user = null;
    try {
        if (userStr) user = JSON.parse(userStr);
    } catch (e) {
        user = null;
    }

    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logout-btn" role="button">${escapeHTML(user.name)} (Logout)</a>`;
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
            });
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Track page view statistics
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        console.error('Failed to record page view:', err);
    }
}

// Dynamically fetch and display courses with fallback
async function loadCourses() {
    const container = document.querySelector('.courses__container');
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();
        if (!Array.isArray(courses) || courses.length === 0) return;

        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

        container.innerHTML = displayCourses.map(course => `
            <article class="course">
              <div class="course__image">
                <img src="${escapeHTML(course.image || './digitalmarketing.png')}" alt="${escapeHTML(course.title)}" loading="lazy" onError="this.onerror=null;this.src='./digitalmarketing.png';">
              </div>
              <div class="course__info">
                <h4>${escapeHTML(course.title)}</h4>
                <p>${escapeHTML(course.description)}</p>
                <a href="courses.html" class="btn btn-primary">Learn More</a>
              </div>
            </article>
        `).join('');
    } catch (err) {
        console.warn('Could not load dynamic courses, using static fallback.', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    loadCourses();
});
