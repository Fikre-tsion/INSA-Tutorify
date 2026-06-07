/**
 * BOLT OPTIMIZATION: Throttle function to limit event execution rate.
 * Useful for high-frequency events like 'scroll' to reduce main-thread workload.
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The time limit in milliseconds.
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Centralized Auth State Management
const checkAuthState = () => {
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
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// BOLT OPTIMIZATION: Throttled scroll event listener (100ms)
// Reduces DOM manipulation frequency during scrolling.
window.addEventListener('scroll', throttle(() => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, 100));

// FAQ Toggle Logic with Keyboard Accessibility
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    // Add tabindex for keyboard focus
    faq.setAttribute('tabindex', '0');

    const handleToggle = () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            if (icon.className === 'uil uil-plus') {
                icon.className = 'uil uil-minus';
            } else {
                icon.className = 'uil uil-plus';
            }
        }
    };

    faq.addEventListener('click', handleToggle);

    // Keyboard support: Enter or Space to toggle
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    });
});

// Mobile Nav Menu Logic
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

// Initialize Auth State on Page Load
document.addEventListener('DOMContentLoaded', checkAuthState);
