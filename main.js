// Navbar scroll handling with passive listener for performance
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Show/hide FAQ answers
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

// Show/hide nav menu with ARIA support
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && menu && closeBtn) {
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

// Centralized Auth UI update
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
        try {
            const user = JSON.parse(userJson);
            authLink.innerHTML = `<a href="#" id="nav-logout-btn">${escapeHTML(user.name)} (Logout)</a>`;
            const logoutBtn = document.getElementById('nav-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.reload();
                });
            }
        } catch (e) {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Helper to escape HTML to prevent XSS
function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Track platform page views
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        // Silently fail if endpoint unreachable
    }
}

// Dynamic course fetching and rendering
async function loadCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();
        if (!Array.isArray(courses) || courses.length === 0) return;

        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

        coursesContainer.innerHTML = '';
        displayCourses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imageDiv = document.createElement('div');
            imageDiv.className = 'course__image';
            const img = document.createElement('img');
            img.src = course.image || './images/digitalmarketing.png';
            img.alt = course.title;
            img.loading = 'lazy';
            imageDiv.appendChild(img);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'course__info';

            const h4 = document.createElement('h4');
            h4.textContent = course.title;

            const p = document.createElement('p');
            p.textContent = course.description;

            const a = document.createElement('a');
            a.href = 'course.html';
            a.className = 'btn btn-primary';
            a.textContent = 'Learn More';

            infoDiv.appendChild(h4);
            infoDiv.appendChild(p);
            infoDiv.appendChild(a);

            article.appendChild(imageDiv);
            article.appendChild(infoDiv);

            coursesContainer.appendChild(article);
        });
    } catch (err) {
        // Fallback to static content if fetch fails
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    loadCourses();
});
