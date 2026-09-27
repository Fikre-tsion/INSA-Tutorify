// dashboard.js - Admin Dashboard dynamic data loader & UI handler

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Route Guard
    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Set welcome username if element exists
    const userTitleEl = document.querySelector('.user-name');
    if (userTitleEl) {
        userTitleEl.textContent = user.name;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateDashboardCards(data);
            if (data.users) {
                renderRecentUsers(data.users);
            }
        } else if (response.status === 401 || response.status === 403) {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
    }

    try {
        const msgResponse = await fetch('/api/messages', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (msgResponse.ok) {
            const messages = await msgResponse.json();
            renderRecentMessages(messages);
        }
    } catch (err) {
        console.error('Error fetching admin messages:', err);
    }
});

function updateDashboardCards(data) {
    const cardNumbers = document.querySelectorAll('.cardBox .card .numbers');
    if (cardNumbers.length >= 4 && data.stats) {
        cardNumbers[0].textContent = (data.stats.pageViews || 0).toLocaleString();
        cardNumbers[1].textContent = (data.coursesCount || data.stats.tutorialsCount || 0).toLocaleString();
        cardNumbers[2].textContent = (data.messagesCount || data.stats.commentsCount || 0).toLocaleString();
        cardNumbers[3].textContent = 'ETB ' + (data.stats.earnings || 0).toLocaleString();
    }
}

function renderRecentMessages(messages) {
    const tbody = document.querySelector('.recentOrders table tbody');
    if (!tbody || !Array.isArray(messages)) return;

    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No recent messages</td></tr>';
        return;
    }

    const thead = document.querySelector('.recentOrders table thead tr');
    if (thead) {
        thead.innerHTML = '<td>Sender</td><td>Message</td><td>Date</td><td>Status</td>';
    }

    const cardHeaderTitle = document.querySelector('.recentOrders .cardHeader h2');
    if (cardHeaderTitle) {
        cardHeaderTitle.textContent = 'Recent Contact Messages';
    }

    tbody.innerHTML = messages.slice(-7).reverse().map(msg => `
        <tr>
            <td>${escapeHTML(msg.firstName + ' ' + (msg.lastName || ''))}</td>
            <td>${escapeHTML(msg.message)}</td>
            <td>${new Date(msg.date || Date.now()).toLocaleDateString()}</td>
            <td><span class="status delivered">Received</span></td>
        </tr>
    `).join('');
}

function renderRecentUsers(users) {
    const userTable = document.querySelector('.recentCustomers table');
    if (!userTable || !Array.isArray(users)) return;

    userTable.innerHTML = users.slice(-5).map(u => `
        <tr>
            <td width="60px">
                <div class="imgBx"><img src="./digitalmarketing.png" alt="User Avatar"></div>
            </td>
            <td>
                <h4>${escapeHTML(u.name)}<br><span>${escapeHTML(u.email)} (${escapeHTML(u.role)})</span></h4>
            </td>
        </tr>
    `).join('');
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

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};
