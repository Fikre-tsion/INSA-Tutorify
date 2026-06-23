// changing navbar style when scrolling
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        // changing icon on faq click
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            if (icon.className === 'uil uil-plus') {
                icon.className = 'uil uil-minus';
            } else {
                icon.className = 'uil uil-plus';
            }
        }
    });

    // Keyboard accessibility for FAQs
    faq.setAttribute('tabindex', '0');
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            faq.click();
        }
    });
});

// show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && menu && closeBtn) {
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

// Authentication UI Centralized Logic
function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

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

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Dynamic Course Rendering
async function fetchAndRenderCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (courses.length > 0) {
            coursesContainer.innerHTML = ''; // Clear static content

            // If on index.html, only show first 3
            const limit = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' ? 3 : courses.length;

            courses.slice(0, limit).forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imageDiv = document.createElement('div');
                imageDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image;
                img.alt = course.title;
                img.loading = 'lazy';
                imageDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'course__info';

                const title = document.createElement('h4');
                title.textContent = course.title;

                const desc = document.createElement('p');
                desc.textContent = course.description;

                const link = document.createElement('a');
                link.href = 'contact.html'; // Redirect to contact since individual course pages are missing
                link.className = 'btn btn-primary';
                link.textContent = 'Learn More';

                infoDiv.appendChild(title);
                infoDiv.appendChild(desc);
                infoDiv.appendChild(link);

                article.appendChild(imageDiv);
                article.appendChild(infoDiv);

                coursesContainer.appendChild(article);
            });
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchAndRenderCourses();
});
