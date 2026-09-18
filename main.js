// Changing navbar style when scrolling with passive listener and lazy caching
let cachedNav = null;
window.addEventListener('scroll', () => {
    if (!cachedNav) cachedNav = document.querySelector('nav');
    if (cachedNav) {
        cachedNav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Show/hide FAQ answer
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

    // Mobile nav toggle
    const menu = document.querySelector(".nav__menu");
    const menuBtn = document.querySelector("#open-menu-btn");
    const closeBtn = document.querySelector("#close-menu-btn");

    if (menuBtn && closeBtn && menu) {
        menuBtn.setAttribute('aria-label', 'Open Menu');
        closeBtn.setAttribute('aria-label', 'Close Menu');

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
    updateAuthUI();

    // Record page view for analytics
    recordPageView();

    // Dynamic courses load
    loadCourses();
});

function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = null;
    }

    if (token && user) {
        if (user.role === 'admin') {
            authLink.innerHTML = `<a href="dashboard.html">Dashboard</a> | <a href="#" onclick="logoutUser(event)">Logout</a>`;
        } else {
            authLink.innerHTML = `<a href="#" onclick="logoutUser(event)">Logout (${escapeHtml(user.name)})</a>`;
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

function logoutUser(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        // Silently handle analytics view failure
    }
}

async function loadCourses() {
    const container = document.querySelector('.courses__container');
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;

        const courses = await response.json();
        if (!Array.isArray(courses) || courses.length === 0) return;

        // Populate dynamic course list cleanly
        container.innerHTML = '';
        courses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imgDiv = document.createElement('div');
            imgDiv.className = 'course__image';

            const img = document.createElement('img');
            img.src = course.image || './images/digitalmarketing.png';
            img.alt = course.title || 'Course Image';
            img.loading = 'lazy';
            img.onerror = () => { img.src = './images/digitalmarketing.png'; };
            imgDiv.appendChild(img);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'course__info';

            const h4 = document.createElement('h4');
            h4.textContent = course.title;

            const p = document.createElement('p');
            p.textContent = course.description;

            const a = document.createElement('a');
            a.href = '#';
            a.className = 'btn btn-primary';
            a.textContent = 'Learn More';

            infoDiv.appendChild(h4);
            infoDiv.appendChild(p);
            infoDiv.appendChild(a);

            article.appendChild(imgDiv);
            article.appendChild(infoDiv);

            container.appendChild(article);
        });
    } catch (err) {
        // Fallback to static html if fetch fails
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
