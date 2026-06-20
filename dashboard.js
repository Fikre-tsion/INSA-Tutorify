document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Fetch stats from API
    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await response.json();

        // Update UI stats
        const numbers = document.querySelectorAll('.numbers');
        if (numbers.length >= 3) {
            numbers[0].textContent = stats.users.toLocaleString();
            numbers[1].textContent = stats.courses.toLocaleString();
            numbers[2].textContent = stats.messages.toLocaleString();
            if (numbers[3]) numbers[3].textContent = stats.earnings.toLocaleString();
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }

    // Navigation toggle
    let toggle = document.querySelector('.toggle');
    let navigation = document.querySelector('.navigation');
    let main = document.querySelector('.main');

    if (toggle && navigation && main) {
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
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
