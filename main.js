// Performance Optimization: Lazy-cache navigation reference to prevent layout thrashing on scroll
let cachedNav = null;

window.addEventListener('scroll', () => {
    if (!cachedNav) {
        cachedNav = document.querySelector('nav');
    }
    if (cachedNav) {
        cachedNav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// FAQ toggle logic
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

// Mobile Nav Menu Handler
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn && menu) {
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

// Global Auth UI & Stats Sync
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    fetchDynamicCourses();
});

function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="#" id="logoutBtn">${escapeHTML(user.name)} (${user.role === 'admin' ? 'Dashboard' : 'Logout'})</a>`;
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (user.role === 'admin') {
                        window.location.href = 'dashboard.html';
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.reload();
                    }
                });
            }
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (e) {
        // Silently handle analytics view failure
    }
}

async function fetchDynamicCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const data = await response.json();

        if (data.courses && data.courses.length > 0) {
            coursesContainer.innerHTML = data.courses.map(course => `
                <article class="course">
                    <div class="course__image">
                        <img src="${escapeHTML(course.image || './digitalmarketing.png')}" alt="${escapeHTML(course.title)}" loading="lazy">
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
        console.warn('Fallback to static course list:', err);
    }
}

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
