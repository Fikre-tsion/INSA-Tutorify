// Navigation scrolling effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
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

// Helper to escape HTML characters
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

// Authentication UI Management
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                const safeName = escapeHTML(user.name);
                authLink.innerHTML = `<a href="#" id="logout-btn">${safeName} (Logout)</a>`;
                const logoutBtn = document.getElementById('logout-btn');
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
}

// Record Page Views
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        // Silently handle tracking errors
    }
}

// Load dynamic courses if course container is present
async function loadCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();

        if (courses && courses.length > 0) {
            // Check if on index.html (limit to 3) or full courses.html page
            const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
            const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

            coursesContainer.innerHTML = displayCourses.map(course => `
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
        console.error('Failed to load courses from API:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    loadCourses();
});
