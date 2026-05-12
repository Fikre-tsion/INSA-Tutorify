// --- Reusable API Service ---
const api = {
    async fetch(url, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                // Token expired or invalid
                if (token) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
            }

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Changing navbar style when scrolling
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) nav.classList.toggle('window-scroll', window.scrollY > 0);
});

// Show/hide FAQ answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq__icon i');
        if (icon) {
            icon.className = faq.classList.contains('open') ? 'uil uil-minus' : 'uil uil-plus';
        }
    })
});

// Show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        if (menu) menu.style.display = "flex";
        if (closeBtn) closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });
}

const closeNav = () => {
    if (menu) menu.style.display = "none";
    if (closeBtn) closeBtn.style.display = "none";
    if (menuBtn) menuBtn.style.display = "inline-block";
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Theme Toggle
const themeToggle = document.querySelector('#theme-toggle');
const currentTheme = localStorage.getItem('theme');

const setTheme = (theme) => {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        if (themeToggle) themeToggle.innerHTML = '<i class="uil uil-moon"></i>';
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.innerHTML = '<i class="uil uil-sun"></i>';
    }
}

setTheme(currentTheme || 'dark');

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const theme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
        setTheme(theme);
        localStorage.setItem('theme', theme);
    });
}

// Auth display logic
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const authLink = document.getElementById('auth-link');

if (token && user && authLink) {
    authLink.innerHTML = `<a href="#" onclick="logout()">${user.name} (Logout)</a>`;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}
window.logout = logout;
window.api = api;
