// Cache DOM elements
const nav = document.querySelector('nav');
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");
const coursesContainer = document.querySelector('.courses__container');

// Changing navbar style when scrolling
window.addEventListener('scroll', () => {
    nav.classList.toggle('window-scroll', window.scrollY > 0);
});

// Show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        icon.className = faq.classList.contains('open') ? 'uil uil-minus' : 'uil uil-plus';
    });
});

// Navigation Menu Toggles
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

// Authentication UI Logic
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

// Dynamic Course Rendering
async function loadCourses() {
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (courses.length > 0) {
            coursesContainer.innerHTML = courses.map(course => `
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
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadCourses();
});
