/**
 * Tutorify Main JS
 * Optimized for performance and centralized Auth UI logic.
 */

// Performance Optimization: Cache DOM elements
const nav = document.querySelector('nav');
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");
const authLink = document.getElementById('auth-link');

// Changing navbar style when scrolling
window.addEventListener('scroll', () => {
    // Only access DOM if needed, but nav is already cached
    nav.classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true }); // Performance: passive listener for scroll

// Show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        // Changing icon on faq click
        const icon = faq.querySelector('.faq_icon i');
        if (icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else {
            icon.className = 'uil uil-plus';
        }
    });
});

// Show nav menu
menuBtn.addEventListener('click', () => {
    menu.style.display = "flex";
    closeBtn.style.display = "inline-block";
    menuBtn.style.display = "none";
});

// Close nav menu
const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
};

closeBtn.addEventListener('click', closeNav);

/**
 * Centralized Auth UI Logic
 * Updates Login/Logout links across all pages.
 */
function updateAuthUI() {
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });

        // If on home page, maybe show admin link if role is admin
        if (user.role === 'admin' && !document.querySelector('.admin-link')) {
             const adminLi = document.createElement('li');
             adminLi.className = 'admin-link';
             adminLi.innerHTML = `<a href="dashboard.html">Dashboard</a>`;
             menu.appendChild(adminLi);
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Initialize Auth UI on load
document.addEventListener('DOMContentLoaded', updateAuthUI);

/**
 * Performance Optimization: Dynamic Course Loading
 * Fetches courses from the API only when needed.
 */
async function fetchCourses(containerSelector, limit = null) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        let courses = await response.json();

        if (limit) courses = courses.slice(0, limit);

        container.innerHTML = courses.map(course => `
            <article class="course">
                <div class="course__image">
                    <img src="${course.image}" alt="${course.title}" loading="lazy">
                </div>
                <div class="course__info">
                    <h4>${course.title}</h4>
                    <p>${course.description}</p>
                    <a href="contact.html" class="btn btn-primary">Learn More</a>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Failed to fetch courses:', error);
    }
}
