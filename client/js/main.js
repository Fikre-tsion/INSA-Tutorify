// --- Reusable API Service ---
const api = {
    async addXP(amount) {
        try {
            await this.fetch('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify({ xp_increment: amount })
            });
            // Update local storage XP if possible
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                user.xp = (user.xp || 0) + amount;
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch (e) { console.error('XP Error:', e); }
    },

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

// --- i18n System ---
const i18n = {
    languages: {
        en: "English",
        am: "አማርኛ",
        om: "Afaan Oromoo",
        ti: "ትግርኛ",
        es: "Español",
        fr: "Français"
    },
    currentLang: localStorage.getItem('lang') || 'en',
    translations: {},

    async init() {
        await this.loadTranslations(this.currentLang);
        this.translatePage();
        this.renderLanguageSelector();
    },

    async loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json`);
            this.translations = await response.json();
            this.currentLang = lang;
            localStorage.setItem('lang', lang);
        } catch (error) {
            console.error(`Failed to load translations for ${lang}:`, error);
        }
    },

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = this.translations[key];
                } else {
                    el.textContent = this.translations[key];
                }
            }
        });
        // Handle special cases like dynamic title updates
        if (this.translations['nav_login'] && document.getElementById('formTitle')) {
             // Form title logic might be better handled in page specific script
        }
    },

    renderLanguageSelector() {
        const navMenu = document.querySelector('.nav__menu');
        if (!navMenu) return;

        let langSelector = document.getElementById('lang-selector-li');
        if (!langSelector) {
            langSelector = document.createElement('li');
            langSelector.id = 'lang-selector-li';
            langSelector.innerHTML = `
                <select id="lang-selector" style="background:transparent; color:inherit; border:1px solid var(--glass-border); border-radius:5px; padding:2px 5px; cursor:pointer;">
                    ${Object.entries(this.languages).map(([code, name]) =>
                        `<option value="${code}" ${code === this.currentLang ? 'selected' : ''}>${name}</option>`
                    ).join('')}
                </select>
            `;
            navMenu.appendChild(langSelector);

            document.getElementById('lang-selector').addEventListener('change', async (e) => {
                await this.loadTranslations(e.target.value);
                this.translatePage();
                // Optionally reload to re-run scripts that might have generated content
                // window.location.reload();
            });
        }
    }
};

// --- Common UI Logic ---

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
        if (themeToggle && themeToggle.querySelector('i')) {
             themeToggle.querySelector('i').className = 'uil uil-moon';
        }
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        if (themeToggle && themeToggle.querySelector('i')) {
             themeToggle.querySelector('i').className = 'uil uil-sun';
        }
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
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (token && user && authLink) {
        let dashboardLink = '';
        if (user.role === 'admin') dashboardLink = `<li><a href="dashboard.html" data-i18n="nav_admin">${i18n.translations['nav_admin'] || 'Admin'}</a></li>`;
        if (user.role === 'teacher') dashboardLink = `<li><a href="teacher-dashboard.html" data-i18n="nav_teach">${i18n.translations['nav_teach'] || 'Teach'}</a></li>`;

        const displayName = user.nickname || user.name;

        const streak = user.streak || 0;
        const shield = user.shieldCount || 0;

        authLink.outerHTML = `
            ${dashboardLink}
            <li class="streak-badge" title="Daily Streak">
                <i class="uil uil-fire" style="color: #ff9f43;"></i> ${streak}
            </li>
            <li class="shield-badge" title="Streak Freeze">
                <i class="uil uil-shield-check" style="color: #54a0ff;"></i> ${shield}
            </li>
            <li><a href="profile.html"><i class="uil uil-user-circle"></i> ${displayName}</a></li>
            <li id="auth-link"><a href="#" onclick="logout()">(<span data-i18n="nav_logout">${i18n.translations['nav_logout'] || 'Logout'}</span>)</a></li>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Global Exports
window.logout = logout;
window.api = api;
window.i18n = i18n;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await i18n.init();
    updateAuthUI();
});
