// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// FAQ toggle
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

// Mobile menu toggle
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

// Auth UI Logic
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        if (token && user) {
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.textContent = `${user.name} (Logout)`;
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
            authLink.innerHTML = '';
            authLink.appendChild(logoutLink);
        } else {
            authLink.innerHTML = '<a href="login.html">Login</a>';
        }
    }
}

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};

// Record page view
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        console.error('Failed to record page view', err);
    }
}

// Dynamic Courses
async function loadCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        // If we are on index.html, only show first 3
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

        if (displayCourses.length > 0) {
            coursesContainer.innerHTML = '';
            displayCourses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imgDiv = document.createElement('div');
                imgDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image;
                img.alt = course.title;
                img.loading = 'lazy';
                imgDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'course__info';
                const h4 = document.createElement('h4');
                h4.textContent = course.title;
                const p = document.createElement('p');
                p.textContent = course.description;
                const a = document.createElement('a');
                a.href = 'courses.html';
                a.className = 'btn btn-primary';
                a.textContent = 'Learn More';

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);
                infoDiv.appendChild(a);

                article.appendChild(imgDiv);
                article.appendChild(infoDiv);
                coursesContainer.appendChild(article);
            });
        }
    } catch (err) {
        console.error('Failed to load courses', err);
    }
}

// Contact Form Handler
const contactForm = document.querySelector('.contact__form');
if (contactForm) {
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
                alert('Message sent successfully!');
                contactForm.reset();
            } else {
                const errData = await response.json();
                alert(errData.message || 'Failed to send message.');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            alert('An error occurred.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    loadCourses();
});
