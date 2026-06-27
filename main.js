// BOLT OPTIMIZATION: Use passive listeners for scroll events to improve scrolling performance
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Authentication UI logic
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (token && user) {
        authLink.innerHTML = '';
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.id = 'logout-btn';
        logoutBtn.textContent = `${user.name} (Logout)`;
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
        authLink.appendChild(logoutBtn);
    } else {
        authLink.innerHTML = '<a href="login.html">Login</a>';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

// Record page view
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        console.error('Failed to record page view:', err);
    }
}

// Dynamic course rendering
async function fetchAndRenderCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

        // SECURITY: Mitigate XSS by using textContent and createElement
        coursesContainer.innerHTML = '';
        displayCourses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imgDiv = document.createElement('div');
            imgDiv.className = 'course__image';
            const img = document.createElement('img');
            img.src = course.image;
            img.alt = course.title;
            imgDiv.appendChild(img);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'course__info';

            const h4 = document.createElement('h4');
            h4.textContent = course.title;

            const p = document.createElement('p');
            p.textContent = course.description;

            const a = document.createElement('a');
            a.href = 'contact.html';
            a.className = 'btn btn-primary';
            a.textContent = 'Learn More';

            infoDiv.appendChild(h4);
            infoDiv.appendChild(p);
            infoDiv.appendChild(a);

            article.appendChild(imgDiv);
            article.appendChild(infoDiv);
            coursesContainer.appendChild(article);
        });
    } catch (err) {
        console.error('Failed to fetch courses:', err);
    }
}

// FAQ logic
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            icon.className = faq.classList.contains('open') ? 'uil uil-minus' : 'uil uil-plus';
        }
    });
});

// Nav menu logic
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    fetchAndRenderCourses();
});
