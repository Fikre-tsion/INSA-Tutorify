document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Update welcome message if element exists (using a more generic topbar selector)
    const topbarUser = document.querySelector('.topbar .user img');
    if (topbarUser) {
        topbarUser.title = `Logged in as ${user.name}`;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();

            const usersStat = document.getElementById('stat-users');
            const coursesStat = document.getElementById('stat-courses');
            const messagesStat = document.getElementById('stat-messages');

            if (usersStat) usersStat.textContent = stats.users.toLocaleString();
            if (coursesStat) coursesStat.textContent = stats.courses.toLocaleString();
            if (messagesStat) messagesStat.textContent = stats.messages.toLocaleString();
        } else if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
});
