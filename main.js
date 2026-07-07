// Changing navbar style when scrolling
window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true });

// Show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else {
            icon.className = 'uil uil-plus';
        }
    });
});

// Show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });
}

const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
};

if (closeBtn) closeBtn.addEventListener('click', closeNav);

// Centralized Auth UI Logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            let dashboardLink = '';
            if (user.role === 'admin') {
                dashboardLink = `<li><a href="dashboard.html">Dashboard</a></li>`;
            }
            authLink.innerHTML = `${dashboardLink}<li><a href="#" id="logout-btn">${user.name} (Logout)</a></li>`;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
};

// Record page view
const recordPageView = async () => {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (e) {
        console.error('Failed to record page view');
    }
};

// Dynamic Course Loading for Courses Page
const loadCourses = async () => {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const res = await fetch('/api/courses');
        const courses = await res.json();

        // If we are on index.html, maybe just show 3. If on courses.html show all.
        const limit = window.location.pathname.includes('courses.html') ? courses.length : 3;

        coursesContainer.innerHTML = '';
        courses.slice(0, limit).forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';
            article.innerHTML = `
                <div class="course__image">
                    <img src="${course.image}" alt="${course.title}" loading="lazy">
                </div>
                <div class="course__info">
                    <h4>${course.title}</h4>
                    <p>${course.description}</p>
                    <a href="courses.html" class="btn btn-primary">Learn More</a>
                </div>
            `;
            coursesContainer.appendChild(article);
        });
    } catch (e) {
        console.error('Failed to load courses');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    loadCourses();
});
