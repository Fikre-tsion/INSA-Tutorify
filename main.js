// Passive scroll listener for performance
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// FAQ show/hide
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

// Nav menu show/hide
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

// Track platform engagement page view
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}
recordPageView();

// Centralized Auth UI update
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    let user = null;
    try {
        if (userStr) user = JSON.parse(userStr);
    } catch (e) {}

    authLink.innerHTML = '';
    const link = document.createElement('a');

    if (token && user) {
        link.href = '#';
        link.textContent = `Logout (${user.name || 'User'})`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        });
    } else {
        link.href = 'login.html';
        link.textContent = 'Login';
    }
    authLink.appendChild(link);
}

// Dynamic safe course rendering
async function renderCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    const pathname = window.location.pathname;
    const isHomePage = pathname.endsWith('index.html') || pathname === '/' || pathname === '' || pathname.endsWith('/');

    try {
        const res = await fetch('/api/courses');
        if (!res.ok) return;
        const courses = await res.json();
        if (!Array.isArray(courses) || courses.length === 0) return;

        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;
        coursesContainer.innerHTML = '';

        displayCourses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imgDiv = document.createElement('div');
            imgDiv.className = 'course__image';

            const img = document.createElement('img');
            img.src = course.image || './images/digitalmarketing.png';
            img.alt = course.title || 'Course Image';
            img.onerror = () => { img.src = './images/digitalmarketing.png'; };
            imgDiv.appendChild(img);

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

            article.appendChild(imgDiv);
            article.appendChild(infoDiv);

            coursesContainer.appendChild(article);
        });
    } catch (e) {
        console.error('Error fetching courses:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    renderCourses();
});
