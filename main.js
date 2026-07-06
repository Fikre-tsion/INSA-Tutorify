// changing navbar style when scrolling
window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true });

// show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        // changing icon on faq click
        const icon = faq.querySelector('.faq_icon i');
        if (icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else {
            icon.className = 'uil uil-plus';
        }
    });
});

// show/hide nav menu
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

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Authentication UI Logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        authLink.innerHTML = ''; // Clear current
        if (token && user) {
            const logoutA = document.createElement('a');
            logoutA.href = '#';
            logoutA.id = 'logout-btn';
            logoutA.textContent = `${user.name} (Logout)`;
            logoutA.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
            authLink.appendChild(logoutA);
        } else {
            const loginA = document.createElement('a');
            loginA.href = 'login.html';
            loginA.textContent = 'Login';
            authLink.appendChild(loginA);
        }
    }
};

// Record Page View
const recordPageView = async () => {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        console.error('Failed to record page view:', err);
    }
};

// Dynamic Course Rendering - Secure Rendering
const fetchAndRenderCourses = async () => {
    const courseContainer = document.querySelector('.courses__container');
    if (!courseContainer) return;

    try {
        const res = await fetch('/api/courses');
        const courses = await res.json();

        // If we are on index.html, only show 3 courses. If on courses.html, show all.
        const limit = window.location.pathname.includes('courses.html') ? courses.length : 3;

        courseContainer.innerHTML = '';
        courses.slice(0, limit).forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imgDiv = document.createElement('div');
            imgDiv.className = 'course__image';
            const img = document.createElement('img');
            img.src = course.image;
            img.alt = course.title;
            img.setAttribute('loading', 'lazy');
            imgDiv.appendChild(img);
            article.appendChild(imgDiv);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'course__info';

            const h4 = document.createElement('h4');
            h4.textContent = course.title;
            infoDiv.appendChild(h4);

            const p = document.createElement('p');
            p.textContent = course.description;
            infoDiv.appendChild(p);

            const a = document.createElement('a');
            a.href = 'courses.html';
            a.className = 'btn btn-primary';
            a.textContent = 'Learn More';
            infoDiv.appendChild(a);

            article.appendChild(infoDiv);
            courseContainer.appendChild(article);
        });
    } catch (err) {
        console.error('Failed to fetch courses:', err);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    fetchAndRenderCourses();
});
