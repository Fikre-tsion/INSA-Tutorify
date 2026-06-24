// Centralized Auth UI logic
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
                window.location.href = 'index.html';
            });
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
};

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) nav.classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true });

// Show/hide FAQ
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            icon.className = faq.classList.contains('open') ? 'uil uil-minus' : 'uil uil-plus';
        }
    });
});

// Responsive Nav Menu
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

// Fetch and render courses
const renderCourses = async () => {
    const container = document.getElementById('courses-container');
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        // If on index.html, only show first 3
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

        container.innerHTML = displayCourses.map(course => `
            <article class="course">
                <div class="course__image">
                    <img src="${course.image}" alt="${course.title}" loading="lazy">
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
        container.innerHTML = '<p>Failed to load courses. Please try again later.</p>';
    }
};

// Handle contact form
const handleContactForm = () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-btn');
        const statusDiv = document.getElementById('form-status');

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                statusDiv.innerHTML = '<p class="status-success">Message sent successfully!</p>';
                form.reset();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            statusDiv.innerHTML = '<p class="status-error">Error sending message. Please try again.</p>';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
};

// Record page view
const recordPageView = () => {
    fetch('/api/stats/view', { method: 'POST' }).catch(err => console.error('Error recording view:', err));
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    renderCourses();
    handleContactForm();
    recordPageView();
});
