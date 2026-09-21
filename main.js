// Navigation bar scroll behavior
let cachedNav = null;
window.addEventListener('scroll', () => {
    if (!cachedNav) cachedNav = document.querySelector('nav');
    if (cachedNav) {
        cachedNav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Show/hide FAQ answers
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

// Navigation menu toggle
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

// Centralized Auth Navigation Bar UI & Page View Recording
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        authLink.innerHTML = '';
        if (token && user) {
            const logoutAnchor = document.createElement('a');
            logoutAnchor.href = '#';
            logoutAnchor.textContent = `${user.name || 'User'} (Logout)`;
            logoutAnchor.onclick = logoutUser;
            authLink.appendChild(logoutAnchor);
        } else {
            const loginAnchor = document.createElement('a');
            loginAnchor.href = 'login.html';
            loginAnchor.textContent = 'Login';
            authLink.appendChild(loginAnchor);
        }
    }
}

function logoutUser(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
});
