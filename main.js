// Changing navbar style when scrolling
let nav = null;
window.addEventListener('scroll', () => {
    if (!nav) nav = document.querySelector('nav');
    if (nav) nav.classList.toggle('window-scroll', window.scrollY > 0);
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

// Page view recording
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        console.warn('Unable to record page view:', err);
    }
}

// Update authentication UI status in navigation bar
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            authLink.textContent = `Logout (${user.name || 'User'})`;
            authLink.href = '#';
            authLink.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                alert('You have logged out.');
                window.location.reload();
            };
        } catch (e) {
            authLink.textContent = 'Login';
            authLink.href = 'login.html';
        }
    } else {
        authLink.textContent = 'Login';
        authLink.href = 'login.html';
    }
}

// Dynamic courses loader
async function loadCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;

        const data = await response.json();
        if (data.courses && data.courses.length > 0) {
            coursesContainer.innerHTML = '';
            data.courses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imageDiv = document.createElement('div');
                imageDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image || './images/digitalmarketing.png';
                img.alt = course.title;
                img.loading = 'lazy';
                imageDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'course__info';

                const h4 = document.createElement('h4');
                h4.textContent = course.title;

                const p = document.createElement('p');
                p.textContent = course.description;

                const a = document.createElement('a');
                a.href = 'course.html';
                a.className = 'btn btn-primary';
                a.textContent = 'Learn More';

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);
                infoDiv.appendChild(a);

                article.appendChild(imageDiv);
                article.appendChild(infoDiv);

                coursesContainer.appendChild(article);
            });
        }
    } catch (e) {
        console.warn('Failed to fetch dynamic courses, using static fallback:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    recordPageView();
    updateAuthUI();
    loadCourses();
});
