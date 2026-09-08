// Cache nav element and add scroll listener with passive option
const navEl = document.querySelector('nav');
if (navEl) {
    window.addEventListener('scroll', () => {
        navEl.classList.toggle('window-scroll', window.scrollY > 0);
    }, { passive: true });
}

// FAQ toggle logic
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

// Navigation menu toggles
const menu = document.querySelector('.nav__menu');
const menuBtn = document.querySelector('#open-menu-btn');
const closeBtn = document.querySelector('#close-menu-btn');

if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = 'flex';
        if (closeBtn) closeBtn.style.display = 'inline-block';
        menuBtn.style.display = 'none';
    });
}

const closeNav = () => {
    if (menu) menu.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'none';
    if (menuBtn) menuBtn.style.display = 'inline-block';
};

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Dynamic Auth UI Update
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            if (user.role === 'admin') {
                authLink.textContent = 'Dashboard';
                authLink.href = 'dashboard.html';
                authLink.onclick = null;
            } else {
                authLink.textContent = 'Logout';
                authLink.href = '#';
                authLink.onclick = (e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                };
            }
        } else {
            authLink.textContent = 'Login';
            authLink.href = 'login.html';
            authLink.onclick = null;
        }
    }
}

// Track platform engagement via /api/stats/view
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
});
