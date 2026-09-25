// Performance Optimization: Cache nav element reference lazily to prevent DOM query overhead on every scroll event
let navElement = null;

// Optimize scroll event listener with passive mode for smooth scrolling
window.addEventListener('scroll', () => {
    if (!navElement) {
        navElement = document.querySelector('nav');
    }
    if (navElement) {
        navElement.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Show/hide FAQ answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        // Changing icon on FAQ click
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

// XSS Prevention Utility
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Centralized Auth UI logic
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            const isAdmin = user.role === 'admin';
            const dashboardBtn = isAdmin ? `<a href="dashboard.html" style="margin-right: 10px; color: #5bc0be;">Dashboard</a>` : '';
            authLink.innerHTML = `${dashboardBtn}<a href="#" id="logoutBtn">${escapeHTML(user.name)} (Logout)</a>`;

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.reload();
                });
            }
        } catch (e) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
}

// Page view analytics recording
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// Dynamic Course Rendering for Courses container
async function loadDynamicCourses() {
    const dynamicContainer = document.querySelector('#dynamic-courses-container');
    if (!dynamicContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();

        if (courses && courses.length > 0) {
            dynamicContainer.innerHTML = courses.map(course => `
                <article class="course">
                    <div class="course__image">
                        <img src="${escapeHTML(course.image)}" alt="${escapeHTML(course.title)}">
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
    loadDynamicCourses();
});
