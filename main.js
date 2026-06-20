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
                logout();
            });
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// FAQ toggle with keyboard accessibility
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.setAttribute('tabindex', '0');

    const toggleFaq = () => {
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

    faq.addEventListener('click', toggleFaq);
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFaq();
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

// Dynamic Course Fetching
const fetchCourses = async () => {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (courses.length > 0) {
            coursesContainer.innerHTML = ''; // Clear placeholders
            courses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';
                article.innerHTML = `
                    <div class="course__image">
                        <img src="${course.image || './images/digitalmarketing.png'}" alt="${course.title}">
                    </div>
                    <div class="course__info">
                        <h4>${course.title}</h4>
                        <p>${course.description}</p>
                        <a href="contact.html" class="btn btn-primary">Learn More</a>
                    </div>
                `;
                coursesContainer.appendChild(article);
            });
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchCourses();
});
