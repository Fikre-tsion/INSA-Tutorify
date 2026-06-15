async function fetchStats() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            // Update UI elements if they exist
            const userStat = document.getElementById('stat-users');
            const courseStat = document.getElementById('stat-courses');
            const messageStat = document.getElementById('stat-messages');

            if (userStat) userStat.textContent = stats.users;
            if (courseStat) courseStat.textContent = stats.courses;
            if (messageStat) messageStat.textContent = stats.messages;
        } else if (response.status === 401 || response.status === 403) {
            alert('Unauthorized access. Redirecting to login.');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', fetchStats);
