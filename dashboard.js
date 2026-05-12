// Theme Toggle for Dashboard
const themeToggle = document.querySelector('#theme-toggle');
const currentTheme = localStorage.getItem('theme');

const setTheme = (theme) => {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        if (themeToggle) themeToggle.innerHTML = '<ion-icon name="moon-outline"></ion-icon>';
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (themeToggle) themeToggle.innerHTML = '<ion-icon name="sunny-outline"></ion-icon>';
    }
}

if (currentTheme) {
    setTheme(currentTheme);
} else {
    setTheme('light');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        let theme = 'light';
        if (!document.body.classList.contains('dark-mode')) {
            theme = 'dark';
        }
        setTheme(theme);
        localStorage.setItem('theme', theme);
    });
}

let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

if (toggle) {
    toggle.onclick = function() {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    }
}

document.querySelectorAll('.navigation ul li').forEach(li => {
    li.addEventListener('click', () => {
        document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
        li.classList.add('hovered');
    });
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
window.logout = logout;
