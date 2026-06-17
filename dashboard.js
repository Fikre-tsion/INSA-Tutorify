document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Fetch Stats
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            const cardNumbers = document.querySelectorAll('.card .numbers');
            if (cardNumbers.length >= 4) {
                cardNumbers[0].textContent = stats.views;
                cardNumbers[1].textContent = stats.tutorials;
                cardNumbers[2].textContent = stats.comments;
                cardNumbers[3].textContent = stats.earnings;
            }
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
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
});
