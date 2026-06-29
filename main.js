// Change navbar style when scrolling (Passive listener for performance)
window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true });

// Show/hide FAQ answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        // Changing icon on FAQ click
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

// Close nav menu
const closeNav = () => {
    if (menu) menu.style.display = "none";
    if (closeBtn) closeBtn.style.display = "none";
    if (menuBtn) menuBtn.style.display = "inline-block";
};

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Secure Data Escaping
const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Dynamic Course Rendering
const fetchCourses = async () => {
    const courseContainer = document.querySelector('.courses__container');
    if (!courseContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        // If on homepage, only show first 3
        const isHomepage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
        const displayCourses = isHomepage ? courses.slice(0, 3) : courses;

        if (displayCourses.length > 0) {
            courseContainer.innerHTML = ''; // Clear static fallback
            displayCourses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const img = document.createElement('img');
                img.src = course.image;
                img.alt = course.title;
                img.loading = 'lazy';

                const imgDiv = document.createElement('div');
                imgDiv.className = 'course__image';
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

                courseContainer.appendChild(article);
            });
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

// Record Page View
const recordPageView = async () => {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (error) {
        console.error('Error recording page view:', error);
    }
};

// Centralized Auth UI Update
const updateAuthUI = () => {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authLink.innerHTML = '';
        const a = document.createElement('a');
        a.href = '#';
        a.id = 'logout-btn';
        a.textContent = `${user.name} (Logout)`;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        });
        authLink.appendChild(a);

        // Add Dashboard link for admins
        if (user.role === 'admin') {
            const navMenu = document.querySelector('.nav__menu');
            const dashboardLi = document.createElement('li');
            const dashA = document.createElement('a');
            dashA.href = 'dashboard.html';
            dashA.textContent = 'Dashboard';
            dashboardLi.appendChild(dashA);
            navMenu.insertBefore(dashboardLi, authLink);
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
    recordPageView();
    updateAuthUI();
});
