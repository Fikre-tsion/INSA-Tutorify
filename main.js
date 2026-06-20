// changing navbar style when scrolling
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true });

// Centralized Auth UI logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (!authLink) return;

    if (token && user) {
        authLink.innerHTML = `
            <div class="auth-user">
                <span>${user.name}</span>
                <a href="#" id="logout-btn" class="btn btn-primary" style="margin-left: 10px; padding: 0.5rem 1rem;">Logout</a>
            </div>
        `;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
};

// Dynamic Course Rendering
const fetchCourses = async () => {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (courses.length === 0) {
            coursesContainer.innerHTML = '<p>No courses available at the moment.</p>';
            return;
        }

        // Limit to 3 if on index page
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
                    <a href="contact.html" class="btn btn-primary">Learn More</a>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

// Contact Form Handler
const handleContactForm = () => {
    const contactForm = document.querySelector('.contact__form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Thank you! Your message has been sent successfully.');
                contactForm.reset();
            } else {
                alert('Oops! Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting contact form:', error);
            alert('Failed to connect to the server.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
};

// FAQ interactivity (Keyboard accessible)
const setupFAQs = () => {
    const faqs = document.querySelectorAll('.faq');
    faqs.forEach(faq => {
        faq.setAttribute('tabindex', '0');
        const toggleFAQ = () => {
            faq.classList.toggle('open');
            const icon = faq.querySelector('.faq_icon i');
            icon.className = faq.classList.contains('open') ? 'uil uil-minus' : 'uil uil-plus';
        };

        faq.addEventListener('click', toggleFAQ);
        faq.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFAQ();
            }
        });
    });
};

// Nav menu toggle (Accessibility)
const setupNavMenu = () => {
    const menu = document.querySelector(".nav__menu");
    const menuBtn = document.querySelector("#open-menu-btn");
    const closeBtn = document.querySelector("#close-menu-btn");

    if (!menuBtn || !closeBtn) return;

    menuBtn.setAttribute('aria-label', 'Open navigation menu');
    closeBtn.setAttribute('aria-label', 'Close navigation menu');

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
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchCourses();
    handleContactForm();
    setupFAQs();
    setupNavMenu();
});
