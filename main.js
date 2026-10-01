// Escape HTML helper function to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Lazy-cached nav DOM reference for scroll handler
let cachedNav = null;
window.addEventListener('scroll', () => {
    if (!cachedNav) {
        cachedNav = document.querySelector('nav');
    }
    if (cachedNav) {
        cachedNav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// FAQ toggle logic and UI bindings
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

    // Navigation Menu Toggle Logic
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

    // Initialize Auth UI & Page View Recording
    updateAuthUI();
    recordPageView();
    loadCourses();
});

// Sync Navigation Auth Links
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            authLink.innerHTML = `<a href="#" id="logout-btn">${escapeHTML(user.name)} (Logout)</a>`;
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'index.html';
                });
            }
        } catch (e) {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Track platform engagement via POST /api/stats/view
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        // Silent catch for analytics
    }
}

// Dynamically fetch and render course catalogue
async function loadCourses() {
    const container = document.getElementById('coursesContainer') || document.getElementById('popularCoursesContainer');
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;

        const courses = await response.json();
        if (Array.isArray(courses) && courses.length > 0) {
            const isPopular = container.id === 'popularCoursesContainer';
            const displayCourses = isPopular ? courses.slice(0, 3) : courses;

            container.innerHTML = displayCourses.map(course => `
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
        console.error('Error fetching courses:', err);
    }
}
