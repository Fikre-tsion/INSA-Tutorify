// Throttle function to limit the execution of a function
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

// Changing navbar style when scrolling (Throttled for performance)
window.addEventListener('scroll', throttle(() => {
    const nav = document.querySelector('nav');
    if (nav) nav.classList.toggle('window-scroll', window.scrollY > 0);
}, 100), { passive: true });

// Show/hide faq answer
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
    })
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
}

const closeNav = () => {
    if (menu && closeBtn && menuBtn) {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    }
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Centralized Auth UI Update (Securely)
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        authLink.innerHTML = ''; // Clear
        const a = document.createElement('a');
        if (token && user) {
            a.href = "#";
            a.textContent = `${user.name} (Logout)`;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        } else {
            a.href = "login.html";
            a.textContent = "Login";
        }
        authLink.appendChild(a);
    }
}

// Record Page View
const recordPageView = async () => {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (error) {
        console.error('Failed to record page view:', error);
    }
}

// Render Courses (Securely)
const renderCourses = async () => {
    const courseContainer = document.querySelector('.courses__container');
    if (!courseContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) throw new Error('Network response was not ok');
        const courses = await response.json();

        const path = window.location.pathname;
        const isHomePage = path.endsWith('index.html') || path.endsWith('/') || path === '' || !path.includes('.html');

        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

        if (displayCourses.length === 0) return;

        courseContainer.innerHTML = ''; // Clear existing content
        displayCourses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';

            const imageDiv = document.createElement('div');
            imageDiv.className = 'course__image';
            const img = document.createElement('img');
            img.src = course.image;
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
            courseContainer.appendChild(article);
        });
    } catch (error) {
        console.error('Failed to fetch courses:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    renderCourses();
});
