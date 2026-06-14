document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update stat numbers by ID
        const updateStat = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        updateStat('stat-views', stats.views);
        updateStat('stat-courses', stats.courses);
        updateStat('stat-contacts', stats.contacts);
        updateStat('stat-users', stats.users);

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Sidebar toggle logic
let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

if (toggle) {
    toggle.onclick = function() {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    }
}

// Navigation hover effect
document.querySelectorAll('.navigation ul li').forEach(li => {
    li.addEventListener('click', () => {
        document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
        li.classList.add('hovered');
    });
});
