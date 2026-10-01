// HTML Sanitizer to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Navigation scroll styling with lazy-cached element reference & passive listener
let cachedNav = null;
window.addEventListener('scroll', () => {
    if (!cachedNav) cachedNav = document.querySelector('nav');
    if (cachedNav) {
        cachedNav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// FAQs accordion behavior
document.addEventListener('DOMContentLoaded', () => {
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
        });
    });

    // Mobile nav toggle
    const menu = document.querySelector(".nav__menu");
    const menuBtn = document.querySelector("#open-menu-btn");
    const closeBtn = document.querySelector("#close-menu-btn");

    if (menuBtn && menu) {
        menuBtn.setAttribute('aria-label', 'Open Menu');
        menuBtn.addEventListener('click', () => {
            menu.style.display = "flex";
            if (closeBtn) closeBtn.style.display = "inline-block";
            menuBtn.style.display = "none";
        });
    }

    if (closeBtn && menu) {
        closeBtn.setAttribute('aria-label', 'Close Menu');
        const closeNav = () => {
            menu.style.display = "none";
            closeBtn.style.display = "none";
            if (menuBtn) menuBtn.style.display = "inline-block";
        };
        closeBtn.addEventListener('click', closeNav);
    }

    // Initialize Auth UI
    updateAuthUI();

    // Record page view
    recordPageView();

    // Fetch dynamic courses if courses container is present
    fetchCourses();

    // Setup Contact form listener if present
    setupContactForm();
});

// Centralized Auth UI Handler
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = null;
    }

    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logoutBtn">${escapeHTML(user.name)} (Logout)</a>`;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
            });
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Record Page View
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        // Silently handle offline/tracking errors
    }
}

// Fetch dynamic courses
async function fetchCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;

        const courses = await response.json();
        if (!Array.isArray(courses) || courses.length === 0) return;

        // Render dynamic courses
        coursesContainer.innerHTML = courses.map(course => `
            <article class="course">
                <div class="course__image">
                    <img src="${escapeHTML(course.image || './digitalmarketing.png')}" alt="${escapeHTML(course.title)}" loading="lazy" onerror="this.src='./digitalmarketing.png'">
                </div>
                <div class="course__info">
                    <h4>${escapeHTML(course.title)}</h4>
                    <p>${escapeHTML(course.description)}</p>
                    <a href="courses.html" class="btn btn-primary">Learn More</a>
                </div>
            </article>
        `).join('');
    } catch (err) {
        console.log('Using static fallback for courses.');
    }
}

// Contact form handling with inline feedback
function setupContactForm() {
    const contactForm = document.querySelector('.contact__form');
    if (!contactForm) return;

    let statusDiv = document.getElementById('contactStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'contactStatus';
        statusDiv.setAttribute('aria-live', 'polite');
        statusDiv.style.marginTop = '1rem';
        statusDiv.style.fontWeight = '500';
        contactForm.appendChild(statusDiv);
    }

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusDiv.style.color = '#5bc0be';
        statusDiv.textContent = 'Sending message...';

        const formData = new FormData(contactForm);
        const data = {
            firstName: formData.get('firstName') || '',
            lastName: formData.get('lastName') || '',
            email: formData.get('email') || '',
            message: formData.get('message') || ''
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                statusDiv.style.color = '#4CAF50';
                statusDiv.textContent = result.message || 'Message sent successfully!';
                contactForm.reset();
            } else {
                statusDiv.style.color = '#f44336';
                statusDiv.textContent = result.message || 'Failed to send message. Please try again.';
            }
        } catch (err) {
            statusDiv.style.color = '#f44336';
            statusDiv.textContent = 'An error occurred. Please try again later.';
        }
    });
}
