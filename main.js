// Performance Optimization: Use passive event listener for scroll event to prevent main thread blocking
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
}, { passive: true });

// Show/hide FAQ answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');

        // Changing icon on FAQ click
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

// Show/hide nav menu with null-guards
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

// Dynamic Auth UI Logic
function updateAuthUI() {
    const navMenu = document.querySelector(".nav__menu");
    if (!navMenu) return;

    let authLi = document.getElementById("auth-link");
    if (!authLi) {
        authLi = document.createElement("li");
        authLi.id = "auth-link";
        navMenu.appendChild(authLi);
    }

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user) {
        if (user.role === "admin") {
            authLi.innerHTML = `<a href="dashboard.html" style="color: #ee7410; font-weight: bold;">Dashboard</a>`;
        } else {
            authLi.innerHTML = `<a href="#" id="logout-btn">Logout (${user.name || 'User'})</a>`;
            const logoutBtn = authLi.querySelector("#logout-btn");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.reload();
                });
            }
        }
    } else {
        authLi.innerHTML = `<a href="login.html">Login</a>`;
    }
}

// Track page view analytics asynchronously without blocking render
function recordPageView() {
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    recordPageView();
});
