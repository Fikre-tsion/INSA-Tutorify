async function fetchAdminStats() {
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
            console.error('Failed to fetch admin stats:', response.statusText);
            return;
        }

        const stats = await response.json();
        renderDashboardStats(stats);
    } catch (err) {
        console.error('Error fetching admin stats:', err);
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderDashboardStats(stats) {
    // Render numbers in cardBox cards
    const cards = document.querySelectorAll('.cardBox .card');
    if (cards.length >= 4) {
        if (stats.views !== undefined) cards[0].querySelector('.numbers').textContent = Number(stats.views).toLocaleString();
        if (stats.coursesCount !== undefined) cards[1].querySelector('.numbers').textContent = stats.coursesCount;
        if (stats.messagesCount !== undefined) cards[2].querySelector('.numbers').textContent = stats.messagesCount;
        if (stats.usersCount !== undefined) cards[3].querySelector('.numbers').textContent = stats.usersCount;
    }

    // Render Recent Messages table
    const recentOrdersContainer = document.querySelector('.recentOrders');
    if (recentOrdersContainer) {
        recentOrdersContainer.classList.add('table-responsive');
        const cardHeader = recentOrdersContainer.querySelector('.cardHeader h2');
        if (cardHeader) cardHeader.textContent = 'Recent Messages';

        const table = recentOrdersContainer.querySelector('table');
        if (table) {
            table.innerHTML = `
                <thead>
                    <tr>
                        <td>Sender</td>
                        <td>Message</td>
                        <td>Date</td>
                        <td>Status</td>
                    </tr>
                </thead>
                <tbody>
                    ${(stats.recentMessages && stats.recentMessages.length > 0) ? stats.recentMessages.map(msg => `
                        <tr>
                            <td>${escapeHTML(msg.firstName)} ${escapeHTML(msg.lastName)}</td>
                            <td>${escapeHTML(msg.message)}</td>
                            <td>${msg.date ? new Date(msg.date).toLocaleDateString() : 'N/A'}</td>
                            <td><span class="status delivered">Received</span></td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="4" style="text-align: center;">No recent messages</td>
                        </tr>
                    `}
                </tbody>
            `;
        }
    }

    // Render Recent Users list
    const recentCustomersTable = document.querySelector('.recentCustomers table');
    if (recentCustomersTable && Array.isArray(stats.recentUsers)) {
        recentCustomersTable.innerHTML = stats.recentUsers.map(user => `
            <tr>
                <td width="60px">
                    <div class="imgBx">
                        <img src="./digitalmarketing.png" alt="${escapeHTML(user.name)}" onError="this.onerror=null;this.src='./digitalmarketing.png';">
                    </div>
                </td>
                <td>
                    <h4>${escapeHTML(user.name)}<br><span>${escapeHTML(user.role)} (${escapeHTML(user.email)})</span></h4>
                </td>
            </tr>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminStats();
});
