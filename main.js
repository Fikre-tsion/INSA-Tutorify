// changing navbar style when scrolling
window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true });

// show/hide faq answer
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

// show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    })
}

const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav)
}

// Authentication UI
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });

        // Add dashboard link if admin
        if (user.role === 'admin' && !document.querySelector('.dashboard-link')) {
            const dashboardLi = document.createElement('li');
            dashboardLi.className = 'dashboard-link';
            dashboardLi.innerHTML = `<a href="dashboard.html">Dashboard</a>`;
            menu.insertBefore(dashboardLi, authLink);
        }
    }
}

// Dynamic Course Rendering
async function fetchAndRenderCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        // On index.html, only show first 3
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const coursesToShow = isHomePage ? courses.slice(0, 3) : courses;

        // Optimized rendering using fragments
        const fragment = document.createDocumentFragment();
        coursesToShow.forEach(course => {
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
            const link = document.createElement('a');
            link.href = 'courses.html';
            link.className = 'btn btn-primary';
            link.textContent = 'Learn More';

            infoDiv.appendChild(h4);
            infoDiv.appendChild(p);
            infoDiv.appendChild(link);

            article.appendChild(imgDiv);
            article.appendChild(infoDiv);
            fragment.appendChild(article);
        });

        coursesContainer.innerHTML = '';
        coursesContainer.appendChild(fragment);
    } catch (err) {
        console.error('Failed to fetch courses:', err);
    }
}

// Record page view
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        console.error('Failed to record page view:', err);
    }
}

// Contact Form Handler
function handleContactForm() {
    const contactForm = document.querySelector('.contact__form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        const submitBtn = contactForm.querySelector('button');
        const originalBtnText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

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
            console.error('Error sending message:', err);
            alert('An error occurred.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchAndRenderCourses();
    recordPageView();
    handleContactForm();
});
