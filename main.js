// Lazy-cache nav for scroll performance
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

// Global Auth UI & Page View Tracking
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let user = null;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        user = null;
    }

    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logoutBtn" style="cursor:pointer;">${user.name} (Logout)</a>`;
        const logoutBtn = document.getElementById('logoutBtn');
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

function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// Dynamic Courses Fetching (if container present)
function fetchDynamicCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    fetch('/api/courses')
        .then(res => res.json())
        .then(courses => {
            if (!courses || !Array.isArray(courses) || courses.length === 0) return;
            coursesContainer.innerHTML = '';
            courses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imageDiv = document.createElement('div');
                imageDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image || './images/digitalmarketing.png';
                img.alt = course.title || 'Course';
                img.loading = 'lazy';
                imageDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'course__info';

                const h4 = document.createElement('h4');
                h4.textContent = course.title;

                const p = document.createElement('p');
                p.textContent = course.description;

                const a = document.createElement('a');
                a.href = 'courses.html';
                a.className = 'btn btn-primary';
                a.textContent = 'Learn More';

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);
                infoDiv.appendChild(a);

                article.appendChild(imageDiv);
                article.appendChild(infoDiv);

                coursesContainer.appendChild(article);
            });
        })
        .catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    fetchDynamicCourses();
});
