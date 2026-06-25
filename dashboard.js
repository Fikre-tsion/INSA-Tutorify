document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }

        const data = await response.json();

        // Update counters
        document.getElementById('stat-views').textContent = data.views.toLocaleString();
        document.getElementById('stat-courses').textContent = data.courseCount;
        document.getElementById('stat-messages').textContent = data.messageCount;
        document.getElementById('stat-users').textContent = data.userCount;

        // Update Messages Table (replacing Recent Tutors for context)
        const messagesTableBody = document.querySelector('.recentOrders table tbody');
        const cardHeader = document.querySelector('.recentOrders .cardHeader h2');
        cardHeader.textContent = 'Recent Messages';

        // Update table headers
        const tableHead = document.querySelector('.recentOrders table thead tr');
        tableHead.innerHTML = `
            <td>Name</td>
            <td>Email</td>
            <td>Message</td>
            <td>Date</td>
        `;

        if (data.messages && data.messages.length > 0) {
            messagesTableBody.innerHTML = data.messages.map(msg => `
                <tr>
                    <td>${msg.name}</td>
                    <td>${msg.email}</td>
                    <td>${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}</td>
                    <td>${new Date(msg.date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } else {
            messagesTableBody.innerHTML = '<tr><td colspan="4">No messages yet.</td></tr>';
        }

        // Update Users List
        const usersTable = document.querySelector('.recentCustomers table');
        if (data.users && data.users.length > 0) {
            usersTable.innerHTML = data.users.map(u => `
                <tr>
                    <td width="60px">
                        <div class="imgBx"><img src="./images2/image.png" alt="User"></div>
                    </td>
                    <td>
                        <h4>${u.name}<br><span>${u.role}</span></h4>
                    </td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
});
