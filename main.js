// Optimize scroll event listener with lazy DOM reference caching and passive listener
let cachedNav = null;
window.addEventListener('scroll', () => {
    if (!cachedNav) {
        cachedNav = document.querySelector('nav');
    }
    if (cachedNav) {
        cachedNav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// FAQ accordion toggling
document.addEventListener('DOMContentLoaded', () => {
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

    // Mobile Navigation Menu handling
    const menu = document.querySelector('.nav__menu');
    const menuBtn = document.querySelector('#open-menu-btn');
    const closeBtn = document.querySelector('#close-menu-btn');

    if (menuBtn && closeBtn && menu) {
        menuBtn.setAttribute('aria-label', 'Open navigation menu');
        closeBtn.setAttribute('aria-label', 'Close navigation menu');

        menuBtn.addEventListener('click', () => {
            menu.style.display = 'flex';
            closeBtn.style.display = 'inline-block';
            menuBtn.style.display = 'none';
        });

        const closeNav = () => {
            menu.style.display = 'none';
            closeBtn.style.display = 'none';
            menuBtn.style.display = 'inline-block';
        };

        closeBtn.addEventListener('click', closeNav);
    }

    // Site-wide Auth state manager
    updateAuthUI();

    // Record page view analytics
    recordPageView();

    // Dynamically load courses if course container is present
    fetchCourses();
});

// Centralized Auth UI update logic
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user && user.name) {
            const dashboardHref = user.role === 'admin' ? 'dashboard.html' : 'index.html';
            authLink.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <a href="${dashboardHref}" style="color: var(--color-warning); font-weight: 600;">${escapeHTML(user.name)}</a>
                    <button onclick="logout()" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 0.85rem; text-decoration: underline; padding: 0;">Logout</button>
                </span>
            `;
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Record page view metric to backend
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// Dynamic course catalog loader
async function fetchCourses() {
    const container = document.querySelector('.courses__container');
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();

        if (courses && courses.length > 0) {
            container.innerHTML = '';
            courses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imgSrc = course.image || './images/course1.jpg';
                const courseTitle = escapeHTML(course.title);
                const courseDesc = escapeHTML(course.description);

                article.innerHTML = `
                    <div class="course__image">
                        <img src="${imgSrc}" alt="${courseTitle}" loading="lazy" onerror="this.onerror=null;this.src='./digitalmarketing.png';">
                    </div>
                    <div class="course__info">
                        <h4>${courseTitle}</h4>
                        <p>${courseDesc}</p>
                        <a href="courses.html" class="btn btn-primary">Learn More</a>
                    </div>
                `;
                container.appendChild(article);
            });
        }
    } catch (err) {
        // Fallback to static html if fetch fails
    }
}

// Helper utility to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
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
