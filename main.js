// Caching DOM elements for performance
const nav = document.querySelector('nav');
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");
const authLink = document.getElementById('auth-link');

// Changing navbar style when scrolling - Throttled for performance
let isScrolling = false;
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            nav.classList.toggle('window-scroll', window.scrollY > 0);
            isScrolling = false;
        });
        isScrolling = true;
    }
});

// Auth display logic centralized
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        if (authLink) {
            authLink.innerHTML = '';
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
        }

        // If on home page, maybe show dashboard link for admin
        if (user.role === 'admin' && !document.querySelector('a[href="dashboard.html"]')) {
             const dashboardLi = document.createElement('li');
             const dLink = document.createElement('a');
             dLink.href = 'dashboard.html';
             dLink.textContent = 'Dashboard';
             dashboardLi.appendChild(dLink);
             menu.insertBefore(dashboardLi, authLink);
        }
    }
};

document.addEventListener('DOMContentLoaded', updateAuthUI);

// Show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        // Changing icon on faq click
        const icon = faq.querySelector('.faq_icon i');
        if (icon && icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else if (icon) {
            icon.className = 'uil uil-plus';
        }
    });
});

// Show/hide nav menu
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });
}

// Close nav menu
const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
};

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Dynamic course rendering helper - Security: Using textContent to prevent XSS
const renderCourses = async (containerSelector, limit = null) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        let courses = await response.json();

        if (limit) {
            courses = courses.slice(0, limit);
        }

        container.innerHTML = '';
        courses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imgDiv = document.createElement('div');
            imgDiv.className = 'course__image';
            const img = document.createElement('img');
            img.src = course.image;
            img.alt = course.title;
            img.loading = 'lazy';
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

            container.appendChild(article);
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

window.renderCourses = renderCourses;
