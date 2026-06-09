// Changing navbar style when scrolling
const nav = document.querySelector('nav');
const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    }
}

window.addEventListener('scroll', throttle(() => {
    nav.classList.toggle('window-scroll', window.scrollY > 0);
}, 100));

// Show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    const handleToggle = () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else {
            icon.className = 'uil uil-plus';
        }
    };
    faq.addEventListener('click', handleToggle);
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    });
});

// Nav menu controls
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

menuBtn.addEventListener('click', () => {
    menu.style.display = "flex";
    closeBtn.style.display = "inline-block";
    menuBtn.style.display = "none";
});

const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
}
closeBtn.addEventListener('click', closeNav);

// Auth state management
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            // Security: Use textContent for name to prevent XSS
            authLink.innerHTML = ''; // Clear previous content
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.id = 'logout-btn';
            logoutLink.textContent = `${user.name} (Logout)`;
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
            authLink.appendChild(logoutLink);
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', updateAuthUI);

// Dynamic Courses Loading
const loadCourses = async (containerSelector, limit = null) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        let courses = await response.json();
        if (limit) courses = courses.slice(0, limit);

        container.innerHTML = '';
        courses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imageDiv = document.createElement('div');
            imageDiv.className = 'course__image';
            const img = document.createElement('img');
            img.src = course.image;
            img.alt = course.title;
            imageDiv.appendChild(img);

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

            article.appendChild(imageDiv);
            article.appendChild(infoDiv);
            container.appendChild(article);
        });
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
};

if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', () => loadCourses('.courses__container', 3));
} else if (window.location.pathname.endsWith('courses.html')) {
    document.addEventListener('DOMContentLoaded', () => loadCourses('.courses__container'));
}
