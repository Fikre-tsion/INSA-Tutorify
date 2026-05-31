// Throttle function to limit the execution rate of a function
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

// Changing navbar style when scrolling (Throttled for performance)
window.addEventListener('scroll', throttle(() => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, 100));

// Centralized authentication UI logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const authLink = document.getElementById('auth-link');

    if (authLink && token && userStr) {
        try {
            const user = JSON.parse(userStr);
            authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
            document.getElementById('logout-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        } catch (e) {
            console.error("Error parsing user data", e);
        }
    }
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};

// Initialize Auth UI
document.addEventListener('DOMContentLoaded', updateAuthUI);

// show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        // changing icon on faq click
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            if (icon.className === 'uil uil-plus') {
                icon.className = 'uil uil-minus';
            } else {
                icon.className = 'uil uil-plus';
            }
        }
    })
});

// show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn && menu) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    })

    // close nav menu
    const closeNav = () => {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    }

    closeBtn.addEventListener('click', closeNav)
}
