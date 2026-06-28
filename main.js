// Changing navbar style when scrolling
window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true });

// Show/hide FAQ answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        // Changing icon on faq click
        const icon = faq.querySelector('.faq_icon i');
        if (icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else {
            icon.className = 'uil uil-plus';
        }
    })
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
    })
}

// Close nav menu
const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Centralized Auth UI logic
const updateAuthUI = () => {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
};

// Fetch and render courses
const fetchCourses = async () => {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        // If on homepage, only show first 3
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

        coursesContainer.innerHTML = displayCourses.map(course => `
            <article class="course">
                <div class="course__image">
                    <img src="${course.image}" alt="${course.title}">
                </div>
                <div class="course__info">
                    <h4>${course.title}</h4>
                    <p>${course.description}</p>
                    <a href="contact.html" class="btn btn-primary">Learn More</a>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

// Record page view
const recordPageView = async () => {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (error) {
        console.error('Error recording page view:', error);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchCourses();
    recordPageView();
});
