document.addEventListener('DOMContentLoaded', () => {
    // Update stats on dashboard
    const updateStats = async () => {
        try {
            const res = await fetch('/api/stats');
            const stats = await res.json();

            const usersEl = document.querySelector('.cardBox .card:nth-child(1) .numbers');
            if (usersEl) usersEl.textContent = stats.users.toLocaleString();

            const coursesEl = document.querySelector('.cardBox .card:nth-child(2) .numbers');
            if (coursesEl) coursesEl.textContent = stats.courses.toLocaleString();

            const contactsEl = document.querySelector('.cardBox .card:nth-child(3) .numbers');
            if (contactsEl) contactsEl.textContent = stats.contacts.toLocaleString();

            const viewsEl = document.querySelector('.cardBox .card:nth-child(4) .numbers');
            if (viewsEl) viewsEl.textContent = stats.views.toLocaleString();
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    updateStats();

    // Toggle navigation
    let toggle = document.querySelector('.toggle');
    let navigation = document.querySelector('.navigation');
    let main = document.querySelector('.main');

    if (toggle) {
        toggle.onclick = function() {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        }
    }

    // Hover effect for nav items
    document.querySelectorAll('.navigation ul li').forEach(li => {
        li.addEventListener('mouseenter', () => {
            document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
            li.classList.add('hovered');
        });
    });
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
