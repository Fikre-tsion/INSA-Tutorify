// BOLT OPTIMIZATION: Throttle function to reduce layout thrashing during scroll
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

// Changing navbar style when scrolling (Throttled)
const nav = document.querySelector('nav');
window.addEventListener('scroll', throttle(() => {
    nav.classList.toggle('window-scroll', window.scrollY > 0);
}, 100));

// show/hide faq answer
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
    })
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
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Centralized Auth UI update
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
            });
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    // Dynamic Course Loading
    const courseContainer = document.querySelector('.courses__container');
    if (courseContainer && window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        fetch('/api/courses')
            .then(res => res.json())
            .then(courses => {
                // Limit to 3 for index page
                const displayCourses = courses.slice(0, 3);
                courseContainer.innerHTML = '';
                displayCourses.forEach(course => {
                    const article = document.createElement('article');
                    article.className = 'course';
                    article.innerHTML = `
                        <div class="course__image">
                            <img src="${course.image}" alt="${course.title}" loading="lazy">
                        </div>
                        <div class="course__info">
                            <h4>${course.title}</h4>
                            <p>${course.description}</p>
                            <a href="contact.html" class="btn btn-primary">Learn More</a>
                        </div>
                    `;
                    courseContainer.appendChild(article);
                });
            });
    }
});
