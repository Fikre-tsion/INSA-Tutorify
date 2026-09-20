// Performance Optimization: Cache nav element reference and use passive scroll listener
let navElement = null;
window.addEventListener('scroll', () => {
    if (!navElement) {
        navElement = document.querySelector('nav');
    }
    if (navElement) {
        navElement.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Show/hide FAQ answer accordion
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

// Mobile menu toggle
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

// Centralized Auth UI update
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                const roleBadge = user.role === 'admin' ? ' (Admin)' : '';
                authLink.innerHTML = `<a href="#" id="logout-btn">${escapeHTML(user.name)}${roleBadge} - Logout</a>`;
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = 'login.html';
                    });
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

// Record page view analytics
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// Secure HTML escaping helper to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Fetch and render courses dynamically if container exists
async function loadDynamicCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const res = await fetch('/api/courses');
        if (!res.ok) return;
        const courses = await res.json();
        if (Array.isArray(courses) && courses.length > 0) {
            // Render dynamically using safe DOM methods
            coursesContainer.innerHTML = '';
            courses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imageDiv = document.createElement('div');
                imageDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image || './digitalmarketing.png';
                img.alt = course.title || 'Course Image';
                img.loading = 'lazy';
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
        console.error('Error fetching dynamic courses:', e);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    loadDynamicCourses();
});
