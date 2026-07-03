// General utility functions for Tutorify frontend

// Changing navbar style when scrolling
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true }); // Performance: passive listener for scroll

// Show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            icon.className = icon.className === 'uil uil-plus' ? 'uil uil-minus' : 'uil uil-plus';
        }
    });
});

// Mobile menu logic
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn && menu) {
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

            // If admin, maybe show link to dashboard if not already there
            if (user.role === 'admin' && !window.location.pathname.includes('dashboard.html')) {
                 const navMenu = document.querySelector('.nav__menu');
                 if (navMenu && !document.getElementById('dashboard-link')) {
                    const li = document.createElement('li');
                    li.id = 'dashboard-link';
                    li.innerHTML = '<a href="dashboard.html">Dashboard</a>';
                    navMenu.insertBefore(li, authLink);
                 }
            }
        } else {
            authLink.innerHTML = '<a href="login.html">Login</a>';
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Dynamic Course Rendering
async function renderCourses() {
    const courseContainer = document.querySelector('.courses__container');
    if (!courseContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (courses.length > 0) {
            // Performance: Only render first 3 if on index.html, else render all
            const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
            const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

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
                        <a href="courses.html" class="btn btn-primary">Learn More</a>
                    </div>
                `;
                courseContainer.appendChild(article);
            });
        }
    } catch (err) {
        console.error("Error fetching courses:", err);
    }
}

// Contact Form Handling
function setupContactForm() {
    const contactForm = document.querySelector('.contact__form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert('Message sent successfully!');
                    contactForm.reset();
                } else {
                    alert('Failed to send message.');
                }
            } catch (err) {
                console.error("Error sending message:", err);
            }
        });
    }
}

// Track Page View
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        // Silent fail
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    renderCourses();
    setupContactForm();
    recordPageView();
});
