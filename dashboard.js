document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        return;
    }

    fetchStats();
});

async function fetchStats() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch admin stats');
            return;
        }

        const data = await response.json();
        updateDashboardCards(data);
        renderRecentMessages(data.recentMessages);
        renderRecentUsers(data.recentUsers);
    } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
    }
}

function updateDashboardCards(data) {
    const numbers = document.querySelectorAll('.cardBox .card .numbers');
    if (numbers.length >= 4) {
        numbers[0].textContent = (data.pageViews || 0).toLocaleString();
        numbers[1].textContent = (data.totalCourses || 0).toLocaleString();
        numbers[2].textContent = (data.totalMessages || 0).toLocaleString();
        numbers[3].textContent = (data.totalUsers || 0).toLocaleString();
    }

    const cardNames = document.querySelectorAll('.cardBox .card .cardName');
    if (cardNames.length >= 4) {
        cardNames[0].textContent = 'Page Views';
        cardNames[1].textContent = 'Courses';
        cardNames[2].textContent = 'Messages';
        cardNames[3].textContent = 'Registered Users';
    }
}

function renderRecentMessages(messages = []) {
    const recentOrdersContainer = document.querySelector('.recentOrders');
    if (!recentOrdersContainer) return;

    const cardHeader = recentOrdersContainer.querySelector('.cardHeader h2');
    if (cardHeader) {
        cardHeader.textContent = 'Recent Messages';
    }

    const tbody = recentOrdersContainer.querySelector('tbody');
    if (!tbody) return;

    if (messages.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 1rem;">No recent messages</td></tr>`;
        return;
    }

    const trs = messages.map(m => {
        const dateStr = m.date ? new Date(m.date).toLocaleDateString() : 'N/A';
        const sender = `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Anonymous';
        return `
            <tr>
                <td>${escapeHTML(sender)}</td>
                <td>${escapeHTML(m.message || '')}</td>
                <td>${escapeHTML(dateStr)}</td>
                <td><span class="status delivered">Received</span></td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = trs;
}

function renderRecentUsers(users = []) {
    const recentCustomersTable = document.querySelector('.recentCustomers table');
    if (!recentCustomersTable) return;

    const cardHeader = document.querySelector('.recentCustomers .cardHeader h2');
    if (cardHeader) {
        cardHeader.textContent = 'Recent Users';
    }

    if (users.length === 0) {
        recentCustomersTable.innerHTML = `<tr><td style="text-align:center; padding: 1rem;">No registered users yet</td></tr>`;
        return;
    }

    const rows = users.map(u => `
        <tr>
            <td width="60px">
                <div class="imgBx"><img src="./digitalmarketing.png" alt="User Avatar" width="40" height="40"></div>
            </td>
            <td>
                <h4>${escapeHTML(u.name || 'User')}<br><span>${escapeHTML(u.email || '')} (${escapeHTML(u.role || 'user')})</span></h4>
            </td>
        </tr>
    `).join('');

    recentCustomersTable.innerHTML = rows;
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
