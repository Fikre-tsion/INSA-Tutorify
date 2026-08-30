// Performance Optimization: Throttle scroll event listener with { passive: true }
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// FAQ Accordion
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

// Mobile Navigation Toggle
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && menu && closeBtn) {
    menuBtn.setAttribute('aria-label', 'Open Navigation Menu');
    closeBtn.setAttribute('aria-label', 'Close Navigation Menu');

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

// Centralized Site-wide Authentication State Management
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
        try {
            const user = JSON.parse(userJson);
            authLink.innerHTML = `<a href="#" id="navLogoutBtn" style="color: #ff6b6b; font-weight: 600;">${user.name || 'User'} (Logout)</a>`;
            const logoutBtn = document.getElementById('navLogoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
            }
        } catch (e) {
            console.error('Error parsing user session:', e);
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Track page visits
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// Dynamic Course Rendering Logic
async function loadCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();

        // If homepage, display top 3 courses; otherwise display all
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
        const coursesToDisplay = isHomePage ? courses.slice(0, 3) : courses;

        coursesContainer.innerHTML = '';
        coursesToDisplay.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imageDiv = document.createElement('div');
            imageDiv.className = 'course__image';
            const img = document.createElement('img');
            img.src = course.image || './images/digitalmarketing.png';
            img.alt = course.title;
            img.setAttribute('loading', 'lazy');
            img.onerror = function() {
                this.onerror = null;
                this.src = './digitalmarketing.png';
            };
            imageDiv.appendChild(img);

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

            article.appendChild(imageDiv);
            article.appendChild(infoDiv);

            coursesContainer.appendChild(article);
        });
    } catch (err) {
        console.error('Failed to load courses:', err);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    loadCourses();
});
