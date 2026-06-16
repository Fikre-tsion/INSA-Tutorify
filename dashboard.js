// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    alert('Access denied. Please login as admin.');
    window.location.href = 'login.html';
}

async function fetchStats() {
    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': token }
        });
        if (!response.ok) throw new Error('Failed to fetch stats');

        const stats = await response.json();

        // Update stats cards
        const numbers = document.querySelectorAll('.numbers');
        if (numbers.length >= 4) {
            numbers[0].textContent = stats.users;
            numbers[1].textContent = stats.courses;
            numbers[2].textContent = stats.messages;
            numbers[3].textContent = 'ETB 0'; // Placeholder for earnings
        }

        // Update recent messages/orders if needed
        // For now, let's just update the card names to reflect real data
        const cardNames = document.querySelectorAll('.cardName');
        if (cardNames.length >= 3) {
            cardNames[0].textContent = 'Total Users';
            cardNames[1].textContent = 'Total Courses';
            cardNames[2].textContent = 'Inquiries';
        }

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchStats();

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
});

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};
