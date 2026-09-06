// Centralized Admin Dashboard Logic
async function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const stats = await response.json();
            const viewsEl = document.getElementById('stat-views');
            const tutsEl = document.getElementById('stat-tutorials');
            const commentsEl = document.getElementById('stat-comments');
            const earningsEl = document.getElementById('stat-earnings');

            if (viewsEl) viewsEl.textContent = stats.profileViews;
            if (tutsEl) tutsEl.textContent = stats.tutorials;
            if (commentsEl) commentsEl.textContent = stats.comments;
            if (earningsEl) earningsEl.textContent = stats.earnings;
        }
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
    }
}

document.addEventListener('DOMContentLoaded', fetchDashboardStats);
