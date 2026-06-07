async function updateStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        document.getElementById('stat-users').innerText = stats.users;
        document.getElementById('stat-courses').innerText = stats.courses;
        document.getElementById('stat-contacts').innerText = stats.contacts;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', updateStats);
