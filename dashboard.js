const loadStats = async () => {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        document.getElementById('stat-views').textContent = stats.profileViews.toLocaleString();
        document.getElementById('stat-tutorials').textContent = stats.tutorials.toLocaleString();
        document.getElementById('stat-comments').textContent = stats.comments.toLocaleString();
        document.getElementById('stat-earnings').textContent = stats.earnings.toLocaleString();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    // Refresh stats every 30 seconds for "real-time" feel
    setInterval(loadStats, 30000);
});
