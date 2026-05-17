// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    alert('Access denied. Please login as admin.');
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // Menu Toggle
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
        li.addEventListener('click', () => {
            document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
            li.classList.add('hovered');
        });
    });

    // Fetch and display admin stats dynamically
    fetchStats();
});

async function fetchStats() {
    try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
            const stats = await response.json();
            const cardBox = document.querySelector('.cardBox');
            if (cardBox && stats) {
                const numbers = cardBox.querySelectorAll('.numbers');
                if (numbers.length >= 4) {
                    numbers[0].textContent = stats.profileViews || '0';
                    numbers[1].textContent = stats.tutorials || '0';
                    numbers[2].textContent = stats.comments || '0';
                    numbers[3].textContent = stats.earnings || '0';
                }
            }
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}
