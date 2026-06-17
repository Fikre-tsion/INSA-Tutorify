document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Populate user profile
    const userImg = document.querySelector('.user img');
    if (userImg) userImg.alt = user.name;

    // Fetch stats
    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': token }
        });

        if (response.ok) {
            const stats = await response.json();
            const usersStat = document.getElementById('stat-users');
            const coursesStat = document.getElementById('stat-courses');
            const messagesStat = document.getElementById('stat-messages');

            if (usersStat) usersStat.textContent = stats.users.toLocaleString();
            if (coursesStat) coursesStat.textContent = stats.courses.toLocaleString();
            if (messagesStat) messagesStat.textContent = stats.messages.toLocaleString();
        } else {
            console.error('Failed to fetch stats');
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

window.logout = logout;
