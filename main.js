// Performance: Throttle function to reduce the number of times a function is called
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
};

// Optimization: Cache the nav element to avoid redundant DOM lookups
const nav = document.querySelector('nav');

// Performance: Throttled scroll event listener
window.addEventListener('scroll', throttle(() => {
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, 100));

// Centralized Auth UI Update Logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
            }
            // If admin, maybe show dashboard link if on index
            if (user.role === 'admin' && !document.getElementById('dashboard-link')) {
                const navMenu = document.querySelector('.nav__menu');
                if (navMenu) {
                    const li = document.createElement('li');
                    li.id = 'dashboard-link';
                    li.innerHTML = '<a href="dashboard.html">Dashboard</a>';
                    navMenu.insertBefore(li, authLink);
                }
            }
        } else {
            authLink.innerHTML = '<a href="login.html">Login</a>';
        }
    }
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// Initialize Auth UI
document.addEventListener('DOMContentLoaded', updateAuthUI);

//show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        //changing icon on faq click
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


//show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn && menu) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    })

    //close nav menu
    const closeNav = () => {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    }

    closeBtn.addEventListener('click', closeNav)
}
