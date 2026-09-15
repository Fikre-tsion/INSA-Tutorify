// changing navbar style when scrolling
let navElement = null;
window.addEventListener('scroll', () => {
    if (!navElement) navElement = document.querySelector('nav');
    if (navElement) {
        navElement.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// show/hide faq answer
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

    const closeNav = () => {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    };

    closeBtn.addEventListener('click', closeNav);
}

// Centralized Auth UI logic
function updateAuthUI() {
    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = null;
    }

    let authLink = document.getElementById('auth-link');
    if (!authLink && menu) {
        authLink = document.createElement('li');
        authLink.id = 'auth-link';
        menu.appendChild(authLink);
    }

    if (authLink) {
        if (token && user) {
            const logoutAnchor = document.createElement('a');
            logoutAnchor.href = '#';
            logoutAnchor.textContent = `${user.name || 'User'} (Logout)`;
            logoutAnchor.onclick = (e) => {
                e.preventDefault();
                logout();
            };
            authLink.replaceChildren(logoutAnchor);
        } else {
            const loginAnchor = document.createElement('a');
            loginAnchor.href = 'login.html';
            loginAnchor.textContent = 'Login';
            authLink.replaceChildren(loginAnchor);
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

// Record page view analytics
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
});
