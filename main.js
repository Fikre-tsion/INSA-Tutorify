// Lazy DOM query caching and passive scroll event listener
let navElement = null;
window.addEventListener('scroll', () => {
    if (!navElement) navElement = document.querySelector('nav');
    if (navElement) {
        navElement.classList.toggle('window-scroll', window.scrollY > 0);
    }
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

// Show/hide nav menu
const menu = document.querySelector('.nav__menu');
const menuBtn = document.querySelector('#open-menu-btn');
const closeBtn = document.querySelector('#close-menu-btn');

if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = 'flex';
        if (closeBtn) closeBtn.style.display = 'inline-block';
        menuBtn.style.display = 'none';
    });
}

const closeNav = () => {
    if (menu) menu.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'none';
    if (menuBtn) menuBtn.style.display = 'inline-block';
};

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Centralized Auth UI logic
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
        const roleBadge = user.role === 'admin' ? ' (Admin)' : '';
        authLink.innerHTML = `<a href="#" id="logout-btn" onclick="logout(); return false;">Logout (${user.name}${roleBadge})</a>`;
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Global logout function
window.logout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// Record page view metric
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// Safely render courses dynamically if container exists
async function loadCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();

        if (Array.isArray(courses) && courses.length > 0) {
            // Determine if we are on index page (show 3) or courses page (show all)
            const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
            const coursesToShow = isHomePage ? courses.slice(0, 3) : courses;

            coursesContainer.innerHTML = '';
            coursesToShow.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imageDiv = document.createElement('div');
                imageDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image || './digitalmarketing.png';
                img.alt = course.title || 'Course Image';
                img.loading = 'lazy';
                img.onerror = () => { img.src = './digitalmarketing.png'; };
                imageDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'course__info';

                const h4 = document.createElement('h4');
                h4.textContent = course.title;

                const p = document.createElement('p');
                p.textContent = course.description;

                const btn = document.createElement('a');
                btn.href = 'courses.html';
                btn.className = 'btn btn-primary';
                btn.textContent = 'Learn More';

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);
                infoDiv.appendChild(btn);

                article.appendChild(imageDiv);
                article.appendChild(infoDiv);

                coursesContainer.appendChild(article);
            });
        }
    } catch (e) {
        console.error('Error loading courses dynamically:', e);
    }
}

// Run initializations
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    loadCourses();
});
