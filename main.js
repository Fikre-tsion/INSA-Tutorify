// Throttle function to limit the rate at which a function can fire.
const throttle = (callback, limit) => {
    let waiting = false;
    return function () {
        if (!waiting) {
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(function () {
                waiting = false;
            }, limit);
        }
    }
}

// changing navbar style when scrolling
window.addEventListener('scroll', throttle(() => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
}, 100));

// show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        // changing icon on faq click
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

menuBtn.addEventListener('click', () => {
    menu.style.display = "flex";
    closeBtn.style.display = "inline-block";
    menuBtn.style.display = "none";
})

// close nav menu
const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
}

closeBtn.addEventListener('click', closeNav)

// Auth UI logic
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
}

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

const renderCourses = async () => {
    const courseContainers = document.querySelectorAll('.courses__container');
    if (courseContainers.length === 0) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (courses.length === 0) return;

        courseContainers.forEach(container => {
            container.innerHTML = '';
            courses.forEach(course => {
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
                container.appendChild(article);
            });
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

const updateStats = async () => {
    const statsContainer = document.querySelector('.cardBox');
    if (!statsContainer) return;

    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        const usersStat = document.getElementById('stat-users');
        const coursesStat = document.getElementById('stat-courses');
        const contactsStat = document.getElementById('stat-contacts');

        if (usersStat) usersStat.textContent = stats.usersCount.toLocaleString();
        if (coursesStat) coursesStat.textContent = stats.coursesCount.toLocaleString();
        if (contactsStat) contactsStat.textContent = stats.contactsCount.toLocaleString();

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    renderCourses();
    updateStats();

    // Fix active nav link
    const activePage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__menu a').forEach(link => {
        if (link.getAttribute('href') === activePage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
