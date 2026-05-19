// changing navbar style when scrolling
window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
});

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
});

// show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn && menu) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });

    // close nav menu
    const closeNav = () => {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    };

    closeBtn.addEventListener('click', closeNav);
}

// Unified Auth Navigation Logic
function updateNavAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const navMenu = document.querySelector('.nav__menu');

    if (navMenu) {
        // Remove existing auth links to avoid duplicates
        const existingAuthLinks = navMenu.querySelectorAll('.auth-item');
        existingAuthLinks.forEach(item => item.remove());

        if (token && user) {
            if (user.role === 'admin') {
                const dashboardLi = document.createElement('li');
                dashboardLi.className = 'auth-item';
                dashboardLi.innerHTML = `<a href="dashboard.html">Dashboard</a>`;
                navMenu.appendChild(dashboardLi);
            }

            const logoutLi = document.createElement('li');
            logoutLi.className = 'auth-item';
            logoutLi.innerHTML = `<a href="#" onclick="logoutUser(event)">Logout (${user.name})</a>`;
            navMenu.appendChild(logoutLi);
        } else {
            const loginLi = document.createElement('li');
            loginLi.className = 'auth-item';
            loginLi.innerHTML = `<a href="login.html">Login</a>`;
            navMenu.appendChild(loginLi);
        }
    }
}

function logoutUser(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Make logoutUser globally accessible
window.logoutUser = logoutUser;

document.addEventListener('DOMContentLoaded', updateNavAuth);
