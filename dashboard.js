const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('stat-views').textContent = stats.views.toLocaleString();
            document.getElementById('stat-tutorials').textContent = stats.tutorials;
            document.getElementById('stat-comments').textContent = stats.comments;
            document.getElementById('stat-earnings').textContent = `$${stats.earnings.toLocaleString()}`;
        } else {
            console.error('Failed to fetch stats');
            if (response.status === 401 || response.status === 403) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', fetchStats);
