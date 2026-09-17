// Passive navbar scroll listener
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('window-scroll', window.scrollY > 0);
        }, { passive: true });
    }

    // Toggle FAQ answers
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

    // Mobile Navigation Menu Toggle
    const menu = document.querySelector('.nav__menu');
    const menuBtn = document.querySelector('#open-menu-btn');
    const closeBtn = document.querySelector('#close-menu-btn');

    if (menuBtn && closeBtn && menu) {
        menuBtn.addEventListener('click', () => {
            menu.style.display = 'flex';
            closeBtn.style.display = 'inline-block';
            menuBtn.style.display = 'none';
        });

        const closeNav = () => {
            menu.style.display = 'none';
            closeBtn.style.display = 'none';
            menuBtn.style.display = 'inline-block';
        };

        closeBtn.addEventListener('click', closeNav);
    }

    // Update Auth Link UI in Navigation
    updateAuthUI();

    // Record Page View Statistic
    recordPageView();

    // Dynamically fetch and render courses if container exists
    fetchAndRenderCourses();
});

function updateAuthUI() {
    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = null;
    }

    const authLink = document.querySelector('.nav__menu #auth-link') || document.getElementById('auth-link');
    if (!authLink) return;

    if (token && user && user.name) {
        authLink.innerHTML = '';
        const logoutAnchor = document.createElement('a');
        logoutAnchor.href = '#';
        logoutAnchor.textContent = `${user.name} (Logout)`;
        logoutAnchor.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        });
        authLink.appendChild(logoutAnchor);
    } else {
        authLink.innerHTML = '<a href="login.html">Login</a>';
    }
}

async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        // Silently ignore tracking errors
    }
}

async function fetchAndRenderCourses() {
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
            img.alt = course.title || 'Course Image';
            img.loading = 'lazy';
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
        console.error('Failed to load courses dynamically:', err);
    }
}
