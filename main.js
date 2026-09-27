// main.js - Core site interactivity and Auth/Analytics state management

// Changing navbar style when scrolling
window.addEventListener('scroll', () => {
    let nav = document.querySelector('nav');
    if (!nav) return;
    nav.classList.toggle('window-scroll', window.scrollY > 0);
}, { passive: true });

// FAQ toggle interactivity
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

// Navigation menu toggle
const menu = document.querySelector('.nav__menu');
const menuBtn = document.querySelector('#open-menu-btn');
const closeBtn = document.querySelector('#close-menu-btn');

if (menuBtn && menu && closeBtn) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = 'flex';
        closeBtn.style.display = 'inline-block';
        menuBtn.style.display = 'none';
    });

    const closeNav = () => {
        menu.style.display = 'none';
        closeBtn.style.display = 'none';
        menuBtn.style.display = 'inline-block';
    };

    closeBtn.addEventListener('click', closeNav);
}

// Global Auth UI updates
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            if (user.role === 'admin') {
                authLink.innerHTML = `<a href="dashboard.html">Dashboard (${escapeHTML(user.name)})</a>`;
            } else {
                authLink.innerHTML = `<a href="#" onclick="logout(); return false;">${escapeHTML(user.name)} (Logout)</a>`;
            }
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

// Global logout function
window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};

// Record Page View
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// HTML escaping helper
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
});
