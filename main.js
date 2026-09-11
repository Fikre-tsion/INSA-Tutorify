// Performance Optimization: Throttle utility to limit high-frequency scroll event callbacks
const throttle = (callback, delay) => {
    let lastTime = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastTime >= delay) {
            lastTime = now;
            callback(...args);
        }
    };
};

// Lazy-cached nav element reference to avoid DOM query on every scroll frame
let cachedNav = null;

const handleScroll = () => {
    if (!cachedNav) cachedNav = document.querySelector('nav');
    if (cachedNav) {
        cachedNav.classList.toggle('window-scroll', window.scrollY > 0);
    }
};

// Add passive scroll listener with 100ms throttling for smooth 60fps scrolling
window.addEventListener('scroll', throttle(handleScroll, 100), { passive: true });

// FAQ Accordion Toggle
const initFAQs = () => {
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
};

// Mobile Navigation Menu Toggle
const initNavMenu = () => {
    const menu = document.querySelector(".nav__menu");
    const menuBtn = document.querySelector("#open-menu-btn");
    const closeBtn = document.querySelector("#close-menu-btn");

    if (menuBtn && closeBtn && menu) {
        menuBtn.addEventListener('click', () => {
            menu.style.display = "flex";
            closeBtn.style.display = "inline-block";
            menuBtn.style.display = "none";
        });

        closeBtn.addEventListener('click', () => {
            menu.style.display = "none";
            closeBtn.style.display = "none";
            menuBtn.style.display = "inline-block";
        });
    }
};

// Centralized Auth UI logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="#" id="logout-btn" style="color: #f75842;">${user.name} (Logout)</a>`;
            const logoutBtn = document.getElementById('logout-btn');
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
};

// Record page view for analytics
const recordPageView = async () => {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (e) {
        // Non-blocking analytics logging
    }
};

// Dynamic Course Fetching for courses.html
const initCoursesPage = async () => {
    const container = document.getElementById('courses-container');
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();

        if (courses && courses.length > 0) {
            container.innerHTML = '';
            courses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imgDiv = document.createElement('div');
                imgDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image || './digitalmarketing.png';
                img.loading = 'lazy';
                img.alt = course.title;
                imgDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'course__info';

                const h4 = document.createElement('h4');
                h4.textContent = course.title;

                const p = document.createElement('p');
                p.textContent = course.description;

                const btn = document.createElement('a');
                btn.href = '#';
                btn.className = 'btn btn-primary';
                btn.textContent = 'Learn More';

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);
                infoDiv.appendChild(btn);

                article.appendChild(imgDiv);
                article.appendChild(infoDiv);

                container.appendChild(article);
            });
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

// Contact Form Handler
const initContactForm = () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('contact-submit-btn');
        const statusDiv = document.getElementById('contact-status');

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!firstName || !lastName || !email || !message) {
            if (statusDiv) {
                statusDiv.style.color = '#f75842';
                statusDiv.textContent = 'Please fill out all fields.';
            }
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, message })
            });

            const data = await res.json();

            if (res.ok) {
                if (statusDiv) {
                    statusDiv.style.color = '#00bf8e';
                    statusDiv.textContent = 'Thank you! Your message has been sent successfully.';
                }
                contactForm.reset();
            } else {
                if (statusDiv) {
                    statusDiv.style.color = '#f75842';
                    statusDiv.textContent = data.message || 'Failed to send message.';
                }
            }
        } catch (err) {
            if (statusDiv) {
                statusDiv.style.color = '#f75842';
                statusDiv.textContent = 'An error occurred. Please try again later.';
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    initFAQs();
    initNavMenu();
    updateAuthUI();
    recordPageView();
    initCoursesPage();
    initContactForm();
});
