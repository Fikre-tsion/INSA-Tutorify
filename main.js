// Centralized Auth UI and dynamic content logic
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    // Auto-fetch courses if on index or courses page
    if (document.querySelector('.courses__container')) {
        fetchCourses();
    }

    // Scroll effect for navbar
    window.addEventListener('scroll', () => {
        document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
    }, { passive: true });

    // FAQ toggle logic
    const faqs = document.querySelectorAll('.faq');
    faqs.forEach(faq => {
        const toggleFaq = () => {
            faq.classList.toggle('open');
            const icon = faq.querySelector('.faq_icon i');
            if (icon.className === 'uil uil-plus') {
                icon.className = 'uil uil-minus';
            } else {
                icon.className = 'uil uil-plus';
            }
        };

        faq.addEventListener('click', toggleFaq);

        // Keyboard accessibility for FAQ
        faq.setAttribute('tabindex', '0');
        faq.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFaq();
            }
        });
    });

    // Nav menu toggle
    const menu = document.querySelector(".nav__menu");
    const menuBtn = document.querySelector("#open-menu-btn");
    const closeBtn = document.querySelector("#close-menu-btn");

    if (menuBtn && closeBtn) {
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
});

function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authLink.innerHTML = `<a href="#" onclick="logout(event)">${user.name} (Logout)</a>`;

        // If admin, show dashboard link if not already present
        if (user.role === 'admin' && !document.getElementById('dashboard-link')) {
            const navMenu = document.querySelector('.nav__menu');
            const dashboardLi = document.createElement('li');
            dashboardLi.id = 'dashboard-link';
            dashboardLi.innerHTML = `<a href="dashboard.html">Dashboard</a>`;
            navMenu.insertBefore(dashboardLi, authLink);
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
        const dashboardLink = document.getElementById('dashboard-link');
        if (dashboardLink) dashboardLink.remove();
    }
}

function logout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

async function fetchCourses() {
    const container = document.querySelector('.courses__container');
    if (!container) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (courses.length > 0) {
            container.innerHTML = ''; // Clear static placeholders

            // Limit to 3 if on index.html, else show all
            const limit = window.location.pathname.includes('courses.html') ? courses.length : 3;

            courses.slice(0, limit).forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';
                article.innerHTML = `
                    <div class="course__image">
                        <img src="${course.image}" alt="${course.title}" onerror="this.src='./images/digitalmarketing.png'">
                    </div>
                    <div class="course__info">
                        <h4>${course.title}</h4>
                        <p>${course.description}</p>
                        <a href="contact.html" class="btn btn-primary">Learn More</a>
                    </div>
                `;
                container.appendChild(article);
            });
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}
