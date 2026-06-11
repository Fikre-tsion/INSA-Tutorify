const throttle = (callback, delay) => {
    let throttleTimeout = null;
    let storedEvent = null;

    const throttledEventHandler = (event) => {
        storedEvent = event;

        const shouldExecute = !throttleTimeout;

        if (shouldExecute) {
            callback(storedEvent);
            storedEvent = null;
            throttleTimeout = setTimeout(() => {
                throttleTimeout = null;
                if (storedEvent) {
                    throttledEventHandler(storedEvent);
                }
            }, delay);
        }
    };

    return throttledEventHandler;
};

// Performance: Throttling scroll event to reduce main thread load
const nav = document.querySelector('nav');
if (nav) {
    window.addEventListener('scroll', throttle(() => {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }, 100));
}

// Centralized authentication UI logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            // Security: Using textContent and individual elements to prevent XSS
            authLink.innerHTML = '';
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.id = 'logout-btn';
            logoutLink.textContent = `${user.name} (Logout)`;
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
            });
            authLink.appendChild(logoutLink);
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
};

updateAuthUI();

//show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.setAttribute('tabindex', '0');

    const handleToggle = () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            if (icon.classList.contains('uil-plus')) {
                icon.classList.remove('uil-plus');
                icon.classList.add('uil-minus');
            } else {
                icon.classList.remove('uil-minus');
                icon.classList.add('uil-plus');
            }
        }
    };

    faq.addEventListener('click', handleToggle);
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    });
});

//show/hide nav menu
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
