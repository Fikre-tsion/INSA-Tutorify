async function fetchStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const stats = await response.json();
            updateDashboardUI(stats);
        } else if (response.status === 401 || response.status === 403) {
            alert('Session expired or unauthorized');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

function updateDashboardUI(stats) {
    // Update numeric cards
    const cards = document.querySelectorAll('.card .numbers');
    if (cards.length >= 4) {
        cards[0].textContent = stats.views.toLocaleString();
        cards[1].textContent = stats.courseCount;
        cards[2].textContent = stats.messageCount;
        cards[3].textContent = stats.userCount; // Replaced Earnings with User Count for relevance
        document.querySelectorAll('.card .cardName')[3].textContent = 'Total Users';
    }

    // Update Recent Messages (Tutors table in HTML)
    const messagesTable = document.querySelector('.recentOrders tbody');
    if (messagesTable && stats.messages) {
        messagesTable.innerHTML = stats.messages.map(msg => `
            <tr>
                <td>${msg.name}</td>
                <td>${msg.email}</td>
                <td>${new Date(msg.date).toLocaleDateString()}</td>
                <td><span class="status inprogress">New</span></td>
            </tr>
        `).join('') || '<tr><td colspan="4">No recent messages</td></tr>';

        // Update header
        document.querySelector('.recentOrders .cardHeader h2').textContent = 'Recent Messages';
        const headers = document.querySelectorAll('.recentOrders thead td');
        if (headers.length >= 3) {
            headers[0].textContent = 'Name';
            headers[1].textContent = 'Email';
            headers[2].textContent = 'Date';
            headers[3].textContent = 'Status';
        }
    }

    // Update Recent Users
    const usersTable = document.querySelector('.recentCustomers table');
    if (usersTable && stats.users) {
        usersTable.innerHTML = stats.users.map(user => `
            <tr>
                <td width="60px">
                    <div class="imgBx"><img src="./images/digitalmarketing.png" alt="User"></div>
                </td>
                <td>
                    <h4>${user.name}<br><span>${user.role}</span></h4>
                </td>
            </tr>
        `).join('') || '<tr><td>No recent users</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', fetchStats);
