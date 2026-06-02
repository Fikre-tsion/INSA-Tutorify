document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        const updateStat = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        updateStat('stat-tutorials', stats.courses);
        updateStat('stat-comments', stats.contacts);
        updateStat('stat-earnings', stats.users);

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
});
