// BOLT OPTIMIZATION: Throttling scroll event to improve rendering performance
const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    }
}

// changing navbar style when scrolling
window.addEventListener('scroll', throttle(() => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
}, 100));

// show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        // changing icon on faq click
        const icon = faq.querySelector('.faq_icon i');
        if (icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else {
            icon.className = 'uil uil-plus';
        }
    })
});

// show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });
}

// close nav menu
const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Authentication display logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const navMenu = document.querySelector('.nav__menu');

    // Remove existing auth links if any
    const existingAuthLink = document.getElementById('auth-link');
    if (existingAuthLink) existingAuthLink.remove();

    const authLi = document.createElement('li');
    authLi.id = 'auth-link';

    if (token && user) {
        authLi.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
        navMenu.appendChild(authLi);

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    } else {
        authLi.innerHTML = `<a href="login.html">Login</a>`;
        navMenu.appendChild(authLi);
    }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);

// Export common functions
window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};
