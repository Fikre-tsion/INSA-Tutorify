// Centralized Navbar Scroll Logic
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('window-scroll', window.scrollY > 0);
});

// Centralized Auth UI state management
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="${user.role === 'admin' ? 'dashboard.html' : '#'}" id="logout-btn">${user.name} (Logout)</a>`;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                if (user.role !== 'admin' || confirm('Do you want to logout?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'index.html';
                }
            });
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

// Dynamic Course Loading
async function loadCourses() {
    const courseContainer = document.querySelector('.courses__container');
    if (!courseContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        // If we are on the homepage, only show first 3
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

        if (displayCourses.length > 0) {
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
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// FAQ logic
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.setAttribute('tabindex', '0'); // Accessibility

    const toggleFaq = () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq__icon i');
        if (icon) {
            icon.className = faq.classList.contains('open') ? 'uil uil-minus' : 'uil uil-plus';
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

// Nav menu logic
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });

    const closeNav = () => {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    };

    closeBtn.addEventListener('click', closeNav);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadCourses();
});
