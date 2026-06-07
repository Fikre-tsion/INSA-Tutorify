// changing navbar style when scrolling
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    // Performance optimization: minimize DOM lookups in scroll events
    nav.classList.toggle('window-scroll', window.scrollY > 0);
});

// show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    // Accessibility: make FAQ keyboard-navigable
    faq.setAttribute('tabindex', '0');

    const toggleFaq = () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq__icon i');
        if (icon) {
            icon.className = icon.className === 'uil uil-plus' ? 'uil uil-minus' : 'uil uil-plus';
        }
    };

    faq.addEventListener('click', toggleFaq);
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFaq();
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

// close nav menu
const closeNav = () => {
    if (menu) menu.style.display = "none";
    if (closeBtn) closeBtn.style.display = "none";
    if (menuBtn) menuBtn.style.display = "inline-block";
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Auth display logic
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const authLink = document.getElementById('auth-link');

if (authLink) {
    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logout-btn" aria-label="Logout">${user.name} (Logout)</a>`;
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

// Helper to fetch courses
async function fetchCourses(containerSelector, limit = null) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        let courses = await response.json();
        if (limit) courses = courses.slice(0, limit);

        container.innerHTML = courses.map(course => `
            <article class="course">
              <div class="course__image">
                <img src="${course.image}" alt="${course.title}" loading="lazy">
              </div>
              <div class="course__info">
                <h4>${course.title}</h4>
                <p>${course.description}</p>
                <a href="contact.html" class="btn btn-primary" aria-label="Learn more about ${course.title}">Learn More</a>
              </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error fetching courses:', error);
        container.innerHTML = '<p>Failed to load courses. Please try again later.</p>';
    }
}

// Initialize based on page
if (document.querySelector('.courses__container')) {
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    fetchCourses('.courses__container', isHomePage ? 3 : null);
}
