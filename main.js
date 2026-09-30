// Helper function to escape HTML string
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Changing navbar style when scrolling
let navElement = null;
window.addEventListener('scroll', () => {
    if (!navElement) navElement = document.querySelector('nav');
    if (navElement) {
        navElement.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// FAQ toggle
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            icon.className = (icon.className === 'uil uil-plus') ? 'uil uil-minus' : 'uil uil-plus';
        }
    });
});

// Navigation menu toggles
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        if (closeBtn) closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
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

// Update authentication link in navigation
function updateAuthUI() {
    const navMenu = document.querySelector('.nav__menu');
    if (!navMenu) return;

    let authLink = document.getElementById('auth-link');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!authLink) {
        authLink = document.createElement('li');
        authLink.id = 'auth-link';
        navMenu.appendChild(authLink);
    }

    if (token && user) {
        authLink.innerHTML = `<a href="${user.role === 'admin' ? 'dashboard.html' : '#'}" id="logoutBtn">Logout (${escapeHTML(user.name)})</a>`;
        const logoutBtn = authLink.querySelector('#logoutBtn');
        if (logoutBtn && user.role !== 'admin') {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateAuthUI();
            });
        }
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Record Page View
function recordPageView() {
    fetch('/api/stats/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).catch(() => {});
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
});
