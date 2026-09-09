// Performance Optimization: Lazy cache nav DOM reference on scroll event with passive listener
let navElement = null;
window.addEventListener('scroll', () => {
    if (!navElement) {
        navElement = document.querySelector('nav');
    }
    if (navElement) {
        navElement.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

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
});

// Show/hide nav menu
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

// Centralized Auth UI Handler
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let authLink = document.getElementById('auth-link');

    if (!authLink && menu) {
        authLink = document.createElement('li');
        authLink.id = 'auth-link';
        menu.appendChild(authLink);
    }

    if (authLink) {
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.logout();
                    });
                }
            } catch (err) {
                authLink.innerHTML = `<a href="login.html">Login</a>`;
            }
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};

// Record Page View Metric
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
});
