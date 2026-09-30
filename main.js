// Helper to prevent XSS when inserting dynamic text into DOM
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
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

// Performance optimization: Lazy cached nav element & passive scroll listener
let navElement = null;
window.addEventListener('scroll', () => {
    if (!navElement) {
        navElement = document.querySelector('nav');
    }
    if (navElement) {
        navElement.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Show/hide FAQ answer
document.addEventListener('DOMContentLoaded', () => {
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

    // Show/hide mobile nav menu
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

    if (closeBtn && menu && menuBtn) {
        const closeNav = () => {
            menu.style.display = "none";
            closeBtn.style.display = "none";
            menuBtn.style.display = "inline-block";
        };
        closeBtn.addEventListener('click', closeNav);
    }

    // Dynamic Auth UI Status
    updateAuthUI();

    // Record page view metric
    recordPageView();
});

// Centralized Auth UI update across pages
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    let authLink = document.getElementById('auth-link');

    if (!authLink) {
        const navMenu = document.querySelector('.nav__menu');
        if (navMenu) {
            authLink = document.createElement('li');
            authLink.id = 'auth-link';
            navMenu.appendChild(authLink);
        }
    }

    if (authLink) {
        if (token && user) {
            const displayName = escapeHTML(user.name || 'User');
            authLink.innerHTML = `<a href="#" onclick="logoutUser(event)">${displayName} (Logout)</a>`;
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

// Global logout handler
window.logoutUser = function(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};

// Record page view metric asynchronously
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' })
        .catch(() => {}); // Non-blocking fire and forget
}
