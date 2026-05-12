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

        // Changing icon on FAQ click
        const icon = faq.querySelector('.faq__icon i');
        if (icon) {
            if (icon.className === 'uil uil-plus') {
                icon.className = 'uil uil-minus';
            } else {
                icon.className = 'uil uil-plus';
            }
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

if (currentTheme) {
    setTheme(currentTheme);
} else {
    // Default to dark mode if not set
    setTheme('dark');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        let theme = 'dark';
        if (!document.body.classList.contains('light-mode')) {
            theme = 'light';
        }
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
