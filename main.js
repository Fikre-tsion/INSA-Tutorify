// Centralized Auth UI logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
            document.getElementById('logout-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
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
        console.error('Failed to record page view', e);
    }
};

// Dynamic course rendering
const renderCourses = async () => {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (courses && courses.length > 0) {
            // If on index.html, only show first 3
            const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
            const displayCourses = isIndex ? courses.slice(0, 3) : courses;

            coursesContainer.innerHTML = displayCourses.map(course => `
                <article class="course">
                    <div class="course__image">
                        <img src="${course.image}" alt="${course.title}" loading="lazy">
                    </div>
                    <div class="course__info">
                        <h4>${course.title}</h4>
                        <p>${course.description}</p>
                        <a href="course.html" class="btn btn-primary">Learn More</a>
                    </div>
                </article>
            `).join('');
        }
    } catch (e) {
        console.error('Failed to fetch courses', e);
    }
};

// Initialization
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

if (menuBtn && closeBtn && menu) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    })

    const closeNav = () => {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    }

    closeBtn.addEventListener('click', closeNav)
}
