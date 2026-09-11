// Passive scroll listener lazy-caching nav element
let cachedNav = null;
window.addEventListener('scroll', () => {
    if (!cachedNav) {
        cachedNav = document.querySelector('nav');
    }
    if (cachedNav) {
        cachedNav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Page View Tracking
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// Centralized Auth UI update
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (!authLink) return;

    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
            });
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Dynamic Courses Loader
async function loadDynamicCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();
        if (!Array.isArray(courses) || courses.length === 0) return;

        // Render dynamic courses
        coursesContainer.innerHTML = '';
        courses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imgDiv = document.createElement('div');
            imgDiv.className = 'course__image';
            const img = document.createElement('img');
            img.src = course.image || './digitalmarketing.png';
            img.alt = course.title;
            img.loading = 'lazy';
            img.onerror = () => { img.src = './digitalmarketing.png'; };
            imgDiv.appendChild(img);

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

            article.appendChild(imgDiv);
            article.appendChild(infoDiv);

            coursesContainer.appendChild(article);
        });
    } catch (err) {
        console.warn('Could not fetch dynamic courses, retaining existing markup.', err);
    }
}

// Show/hide FAQ answer and setup handlers
document.addEventListener('DOMContentLoaded', () => {
    recordPageView();
    updateAuthUI();
    loadDynamicCourses();

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

    // Mobile Navigation Menu
    const menu = document.querySelector(".nav__menu");
    const menuBtn = document.querySelector("#open-menu-btn");
    const closeBtn = document.querySelector("#close-menu-btn");

    if (menuBtn && menu) {
        menuBtn.addEventListener('click', () => {
            menu.style.display = "flex";
            if (closeBtn) closeBtn.style.display = "inline-block";
            menuBtn.style.display = "none";
        });
    }

    if (closeBtn && menu) {
        const closeNav = () => {
            menu.style.display = "none";
            closeBtn.style.display = "none";
            if (menuBtn) menuBtn.style.display = "inline-block";
        };
        closeBtn.addEventListener('click', closeNav);
    }
});
