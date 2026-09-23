// Lazy-cache navbar reference and passive scroll event listener
let navElem = null;
window.addEventListener('scroll', () => {
    if (!navElem) navElem = document.querySelector('nav');
    if (navElem) navElem.classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true });

// Show/hide FAQ answer
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

// Show/hide nav menu with ARIA accessibility
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn && menu) {
    menuBtn.setAttribute('aria-label', 'Open navigation menu');
    closeBtn.setAttribute('aria-label', 'Close navigation menu');

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

// XSS Sanitization helper
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Centralized Auth UI logic
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const authLink = document.getElementById('auth-link');

    if (!authLink) return;

    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logout-btn" aria-label="Logout">${escapeHTML(user.name)} (Logout)</a>`;
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateAuthUI();
                window.location.reload();
            });
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Record page view metric
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// Dynamic Course Loader for courses page / index page
async function loadDynamicCourses() {
    const coursesContainer = document.querySelector('.courses__container[data-dynamic="true"]');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();
        if (!Array.isArray(courses) || courses.length === 0) return;

        coursesContainer.innerHTML = '';
        courses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';
            article.innerHTML = `
                <div class="course__image">
                    <img src="${escapeHTML(course.image)}" alt="${escapeHTML(course.title)}" loading="lazy">
                </div>
                <div class="course__info">
                    <h4>${escapeHTML(course.title)}</h4>
                    <p>${escapeHTML(course.description)}</p>
                    <a href="courses.html" class="btn btn-primary">Learn More</a>
                </div>
            `;
            coursesContainer.appendChild(article);
        });
    } catch (e) {
        console.error('Failed to load courses from API:', e);
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    loadDynamicCourses();
});
