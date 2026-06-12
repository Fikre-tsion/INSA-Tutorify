// Utility function for throttling scroll events to improve performance
const throttle = (callback, limit) => {
    let waiting = false;
    return function() {
        if (!waiting) {
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(() => {
                waiting = false;
            }, limit);
        }
    };
};

// Navbar scroll logic - cached the nav element for better performance
const nav = document.querySelector('nav');
const handleScroll = () => {
    nav.classList.toggle('window-scroll', window.scrollY > 0);
};

// Throttled scroll listener to prevent excessive layout thrashing
window.addEventListener('scroll', throttle(handleScroll, 100));

//show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    // Add accessibility attributes
    faq.setAttribute('tabindex', '0');
    faq.setAttribute('role', 'button');
    faq.setAttribute('aria-expanded', 'false');

    const toggleFaq = () => {
        faq.classList.toggle('open');
        const isOpen = faq.classList.contains('open');
        faq.setAttribute('aria-expanded', isOpen);

        //changing icon on faq click
        const icon = faq.querySelector('.faq_icon i');
        if (icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else {
            icon.className = 'uil uil-plus';
        }
    };

    faq.addEventListener('click', toggleFaq);

    // Keyboard accessibility for FAQ items
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFaq();
        }
    });
});

//show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    })
}

//close nav menu
const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Centralized Auth UI logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const authLink = document.getElementById('auth-link');

    if (!authLink) return;

    if (token && userJson) {
        const user = JSON.parse(userJson);
        authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
};

document.addEventListener('DOMContentLoaded', updateAuthUI);
