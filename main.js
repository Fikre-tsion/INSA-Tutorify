// Changing navbar style when scrolling
const nav = document.querySelector('nav');
if (nav) {
    window.addEventListener('scroll', () => {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    });
}

// Show/hide faq answer
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
    // Accessibility: Keyboard support for FAQ
    faq.setAttribute('tabindex', '0');
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            faq.click();
        }
    });
});

// Nav menu toggle
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        if (menu) menu.style.display = "flex";
        if (closeBtn) closeBtn.style.display = "inline-block";
        if (menuBtn) menuBtn.style.display = "none";
    });
}

const closeNav = () => {
    if (menu) menu.style.display = "none";
    if (closeBtn) closeBtn.style.display = "none";
    if (menuBtn) menuBtn.style.display = "inline-block";
};

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Centralized Site Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadCourses();
    loadStats();
});

function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (token && user && authLink) {
        authLink.innerHTML = '';
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = `${user.name} (Logout)`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        });
        authLink.appendChild(link);
    }
}

function loadCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    fetch('/api/courses')
        .then(res => res.json())
        .then(courses => {
            if (courses.length > 0) {
                const limit = window.location.pathname.includes('courses.html') ? courses.length : 3;
                coursesContainer.innerHTML = '';
                courses.slice(0, limit).forEach(course => {
                    const article = document.createElement('article');
                    article.className = 'course';

                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'course__image';
                    const img = document.createElement('img');
                    img.src = course.image || './images/digitalmarketing.png';
                    img.alt = course.title;
                    img.loading = 'lazy';
                    imgDiv.appendChild(img);

                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'course__info';

                    const title = document.createElement('h4');
                    title.textContent = course.title;

                    const desc = document.createElement('p');
                    desc.textContent = course.description;

                    const btn = document.createElement('a');
                    btn.href = 'contact.html';
                    btn.className = 'btn btn-primary';
                    btn.textContent = 'Learn More';

                    infoDiv.appendChild(title);
                    infoDiv.appendChild(desc);
                    infoDiv.appendChild(btn);

                    article.appendChild(imgDiv);
                    article.appendChild(infoDiv);
                    coursesContainer.appendChild(article);
                });
            }
        })
        .catch(err => console.error('Error loading courses:', err));
}

function loadStats() {
    const statsUsers = document.getElementById('stat-users');
    if (!statsUsers) return;

    fetch('/api/stats')
        .then(res => res.json())
        .then(stats => {
            if (document.getElementById('stat-users')) document.getElementById('stat-users').textContent = stats.users;
            if (document.getElementById('stat-courses')) document.getElementById('stat-courses').textContent = stats.courses;
            if (document.getElementById('stat-contacts')) document.getElementById('stat-contacts').textContent = stats.contacts;
        })
        .catch(err => console.error('Error loading stats:', err));
}
