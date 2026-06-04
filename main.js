// Throttle function to limit the number of times a function is called
const throttle = (callback, delay) => {
    let lastTime = 0;
    let timer = null;
    return (...args) => {
        const now = Date.now();
        if (now - lastTime >= delay) {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            callback(...args);
            lastTime = now;
        } else if (!timer) {
            timer = setTimeout(() => {
                callback(...args);
                lastTime = Date.now();
                timer = null;
            }, delay - (now - lastTime));
        }
    };
};

/**
 * BOLT PERFORMANCE OPTIMIZATION:
 * Implementation: Scroll event throttling (100ms)
 * Impact: Reduces DOM updates and style recalculations during scroll,
 * improving frame rates especially on lower-end devices.
 */
window.addEventListener('scroll', throttle(() => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, 100));

// Show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        // Changing icon on faq click
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

if (menuBtn && closeBtn && menu) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });

    // Close nav menu
    const closeNav = () => {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    };

    closeBtn.addEventListener('click', closeNav);
}

// Centralized Auth display logic
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink && token && user) {
        // SECURITY: Use textContent for user-provided name to prevent XSS
        authLink.innerHTML = ''; // Clear "Login" link
        const link = document.createElement('a');
        link.href = '#';
        link.id = 'logout-btn';
        link.textContent = `${user.name} (Logout)`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        });
        authLink.appendChild(link);
    }
});
