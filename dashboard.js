// dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');

        const stats = await response.json();

        // Update cards
        document.getElementById('stat-views').textContent = stats.views.toLocaleString();
        document.getElementById('stat-courses').textContent = stats.courseCount;
        document.getElementById('stat-messages').textContent = stats.messageCount;
        document.getElementById('stat-users').textContent = stats.userCount;

        // Update Recent Messages
        const messageTableBody = document.querySelector('#recent-messages-table tbody');
        messageTableBody.innerHTML = stats.recentMessages.map(msg => `
            <tr>
                <td>${msg.firstName} ${msg.lastName}</td>
                <td>${msg.email}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${msg.message}</td>
                <td>${new Date(msg.date).toLocaleDateString()}</td>
            </tr>
        `).join('');

        // Update Recent Users
        const userTable = document.getElementById('recent-users-table');
        userTable.innerHTML = stats.recentUsers.map(user => `
            <tr>
                <td width="60px">
                    <div class="imgBx"><img src="./images2/image.png" alt="User"></div>
                </td>
                <td>
                    <h4>${user.name}<br><span>${user.role}</span></h4>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
});
