// Performance Optimization: Cache frequently accessed DOM elements
const nav = document.querySelector('nav');
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

// Throttle function for performance
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Changing navbar style when scrolling (Optimized with throttle and cached element)
window.addEventListener('scroll', throttle(() => {
    if (nav) nav.classList.toggle('window-scroll', window.scrollY > 0);
}, 100));

// Show/hide faq answer with keyboard accessibility
const faqs = document.querySelectorAll('.faq');
const handleToggle = (faq) => {
    faq.classList.toggle('open');
    const icon = faq.querySelector('.faq_icon i');
    if (icon) {
        if (icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else {
            icon.className = 'uil uil-plus';
        }
    }
};

faqs.forEach(faq => {
    faq.addEventListener('click', () => handleToggle(faq));
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle(faq);
        }
    });
});

// Nav menu toggle
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
    }

    closeBtn.addEventListener('click', closeNav);
}

// Dynamic Course Rendering
const createCourseCard = (course) => {
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
    return article;
};

const loadCourses = async () => {
    const popularContainer = document.getElementById('popular-courses');
    const allContainer = document.getElementById('all-courses');

    if (!popularContainer && !allContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (popularContainer) {
            courses.slice(0, 3).forEach(course => {
                popularContainer.appendChild(createCourseCard(course));
            });
        }

        if (allContainer) {
            courses.forEach(course => {
                allContainer.appendChild(createCourseCard(course));
            });
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
};

// Contact Form Submission
const initContactForm = () => {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                status.textContent = "Message sent successfully!";
                status.style.color = "var(--color-success)";
                form.reset();
            } else {
                status.textContent = "Failed to send message.";
                status.style.color = "red";
            }
        } catch (error) {
            status.textContent = "An error occurred.";
            status.style.color = "red";
        }
    });
};

// Site-wide Auth UI Management
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
            const logoutBtn = document.getElementById('logout-btn');
            logoutBtn.addEventListener('click', (e) => {
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

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    initContactForm();
    updateAuthUI();
});
