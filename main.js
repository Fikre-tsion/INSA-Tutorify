// Throttle function for performance optimization
const throttle = (func, limit) => {
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

// Changing navbar style when scrolling (optimized with throttle)
window.addEventListener('scroll', throttle(() => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
}, 100));

// show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            icon.className = icon.className === 'uil uil-plus' ? 'uil uil-minus' : 'uil uil-plus';
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
    })
}

const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Auth state management UI
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const navMenu = document.querySelector('.nav__menu');

    if (navMenu) {
        let authItem = document.getElementById('auth-item');
        if (!authItem) {
            authItem = document.createElement('li');
            authItem.id = 'auth-item';
            navMenu.appendChild(authItem);
        }

        if (token && user) {
            let dashboardLink = '';
            if (user.role === 'admin') {
                dashboardLink = '<li><a href="dashboard.html">Dashboard</a></li>';
            }
            authItem.innerHTML = `
                ${dashboardLink}
                <a href="#" id="logout-btn">${user.name} (Logout)</a>
            `;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });

            // Remove the original login link if it exists
            const originalLogin = document.querySelector('li a[href="login.html"]');
            if (originalLogin && originalLogin.parentElement) {
                originalLogin.parentElement.style.display = 'none';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);
