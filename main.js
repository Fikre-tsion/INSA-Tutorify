// Centralized Auth UI logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = ''; // Clear
            const link = document.createElement('a');
            link.href = '#';
            link.id = 'logout-btn';
            link.textContent = `${user.name} (Logout)`;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
            authLink.appendChild(link);
        } else {
            authLink.innerHTML = '<a href="login.html">Login</a>';
        }
    }
};

// Record page view
const recordPageView = async () => {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        console.error('Failed to record page view:', err);
    }
};

// Dynamic Course Rendering
const renderCourses = async () => {
    const courseContainer = document.querySelector('.courses__container');
    if (!courseContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const coursesToDisplay = isHomePage ? courses.slice(0, 3) : courses;

        if (coursesToDisplay.length > 0) {
            courseContainer.innerHTML = ''; // Clear static content
            coursesToDisplay.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imgDiv = document.createElement('div');
                imgDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image;
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

                const a = document.createElement('a');
                a.href = 'course.html';
                a.className = 'btn btn-primary';
                a.textContent = 'Learn More';

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);
                infoDiv.appendChild(a);

                article.appendChild(imgDiv);
                article.appendChild(infoDiv);
                courseContainer.appendChild(article);
            });
        }
    } catch (err) {
        console.error('Failed to fetch courses:', err);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    renderCourses();
});

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
        if (icon) {
            icon.className = faq.classList.contains('open') ? 'uil uil-minus' : 'uil uil-plus';
        }
    });
});

// Show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn && menu) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });

    closeBtn.addEventListener('click', () => {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    });
}
