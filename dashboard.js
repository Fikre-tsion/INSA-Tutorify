document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Toggle menu
    let toggle = document.querySelector('.toggle');
    let navigation = document.querySelector('.navigation');
    let main = document.querySelector('.main');

    if (toggle) {
        toggle.onclick = function() {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        }
    }

    // Fetch Stats
    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const stats = await response.json();
            const numbers = document.querySelectorAll('.cardBox .card .numbers');
            if (numbers.length >= 4) {
                numbers[0].textContent = stats.users.toLocaleString();
                numbers[0].nextElementSibling.textContent = 'Total Users';

                numbers[1].textContent = stats.courses.toLocaleString();
                numbers[1].nextElementSibling.textContent = 'Courses';

                numbers[2].textContent = stats.messages.toLocaleString();
                numbers[2].nextElementSibling.textContent = 'Messages';

                // Keep the 4th card as placeholder or earnings
            }
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
