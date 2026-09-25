// Helper function to escape HTML string
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }
    } catch (e) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Session expired or unauthorized. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            console.error('Failed to fetch dashboard metrics');
            return;
        }

        const stats = await response.json();

        // Update dashboard metric cards
        const viewsElem = document.getElementById('num-views');
        if (viewsElem) viewsElem.textContent = (stats.views || 0).toLocaleString();

        const coursesElem = document.getElementById('num-courses');
        if (coursesElem) coursesElem.textContent = (stats.coursesCount || 0).toLocaleString();

        const messagesElem = document.getElementById('num-messages');
        if (messagesElem) messagesElem.textContent = (stats.messagesCount || 0).toLocaleString();

        const usersElem = document.getElementById('num-users');
        if (usersElem) usersElem.textContent = (stats.usersCount || 0).toLocaleString();

        // Update recent messages table if data present
        const messagesTableBody = document.getElementById('messages-table-body');
        if (messagesTableBody && Array.isArray(stats.messages)) {
            if (stats.messages.length === 0) {
                messagesTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No recent messages</td></tr>`;
            } else {
                messagesTableBody.innerHTML = stats.messages.map(msg => `
                    <tr>
                        <td>${escapeHTML(msg.sender)}</td>
                        <td>${escapeHTML(msg.message)}</td>
                        <td>${escapeHTML(msg.date)}</td>
                        <td><span class="status ${msg.status === 'Pending' ? 'pending' : 'delivered'}">${escapeHTML(msg.status || 'Received')}</span></td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Error fetching admin statistics:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
});
