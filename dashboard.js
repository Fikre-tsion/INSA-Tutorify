// Centralized Admin Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
});

/**
 * Asynchronously fetch system statistics and dynamic table data from backend
 */
async function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn('Unauthorized access to dashboard stats');
            }
            return;
        }

        const data = await response.json();
        updateCardStats(data.stats);
        renderMessagesTable(data.messages);
        renderUsersList(data.users);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

/**
 * Update UI metric counter cards
 */
function updateCardStats(stats) {
    if (!stats) return;
    const cards = document.querySelectorAll('.cardBox .card .numbers');
    if (cards.length >= 4) {
        cards[0].textContent = Number(stats.profileViews || 0).toLocaleString();
        cards[1].textContent = Number(stats.tutorials || 0).toLocaleString();
        cards[2].textContent = Number(stats.comments || 0).toLocaleString();
        cards[3].textContent = `$${Number(stats.earnings || 0).toLocaleString()}`;
    }
}

/**
 * Render contact form messages in admin table
 */
function renderMessagesTable(messages) {
    const tbody = document.querySelector('.recentOrders table tbody');
    if (!tbody || !messages || messages.length === 0) return;

    // Sanitize and replace placeholder content with live contact form submissions
    tbody.innerHTML = messages.slice(-10).reverse().map(msg => `
        <tr>
            <td>${escapeHTML(msg.sender || 'Anonymous')}</td>
            <td>${escapeHTML(msg.message || 'N/A')}</td>
            <td>${escapeHTML(msg.date || 'Today')}</td>
            <td><span class="status ${msg.status === 'Read' ? 'delivered' : 'pending'}">${escapeHTML(msg.status || 'Unread')}</span></td>
        </tr>
    `).join('');
}

/**
 * Render registered users list
 */
function renderUsersList(users) {
    const tbody = document.querySelector('.recentCustomers table');
    if (!tbody || !users || users.length === 0) return;

    tbody.innerHTML = users.slice(-5).reverse().map(user => `
        <tr>
            <td width="60px">
                <div class="imgBx"><img src="./digitalmarketing.png" alt="User Avatar" width="40" height="40" onerror="this.src='./digitalmarketing.png'"></div>
            </td>
            <td>
                <h4>${escapeHTML(user.name)}<br><span>${escapeHTML(user.email)} (${escapeHTML(user.role)})</span></h4>
            </td>
        </tr>
    `).join('');
}

/**
 * XSS Prevention Helper
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
