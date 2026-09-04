// Centralized Auth UI logic
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="#" onclick="logoutUser(event)">${user.name || 'User'} (Logout)</a>`;
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

function logoutUser(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

// Track platform engagement via page view counter
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        // Non-critical background tracking call
    }
}

// Dynamic course catalog loader for courses.html
async function loadDynamicCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();

        if (Array.isArray(courses) && courses.length > 0) {
            coursesContainer.innerHTML = '';
            courses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imageDiv = document.createElement('div');
                imageDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image || './digitalmarketing.png';
                img.alt = course.title || 'Course Image';
                img.loading = 'lazy';
                imageDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'course__info';

                const h4 = document.createElement('h4');
                h4.textContent = course.title || 'Untitled Course';

                const p = document.createElement('p');
                p.textContent = course.description || 'No description available.';

                const btn = document.createElement('a');
                btn.href = 'contact.html';
                btn.className = 'btn btn-primary';
                btn.textContent = 'Enroll Now';

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);
                infoDiv.appendChild(btn);

                article.appendChild(imageDiv);
                article.appendChild(infoDiv);

                coursesContainer.appendChild(article);
            });
        }
    } catch (err) {
        console.error('Error fetching courses:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();

    if (window.location.pathname.includes('courses.html')) {
        loadDynamicCourses();
    }

    // Performance Optimization: Registered as passive event listener to allow unblocked scrolling
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (nav) {
            nav.classList.toggle('window-scroll', window.scrollY > 0);
        }
    }, { passive: true });

    // FAQ Show/Hide logic
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

    // Nav Menu Toggle logic
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
});
