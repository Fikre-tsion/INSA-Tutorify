const fetchDashboardStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Unauthorized access to dashboard.');
                window.location.href = 'login.html';
            }
            return;
        }

        const stats = await response.json();

        // Update Cards
        document.getElementById('stat-views').textContent = stats.views.toLocaleString();
        document.getElementById('stat-courses').textContent = stats.courseCount;
        document.getElementById('stat-messages').textContent = stats.messageCount;
        document.getElementById('stat-users').textContent = stats.userCount;

        // Update Messages Table
        const messageTbody = document.querySelector('#messages-table tbody');
        if (messageTbody) {
            messageTbody.innerHTML = stats.messages.map(msg => `
                <tr>
                    <td>${msg.name}</td>
                    <td>${msg.email}</td>
                    <td>${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}</td>
                    <td>${new Date(msg.date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }

        // Update Users Table
        const userTable = document.querySelector('#users-table');
        if (userTable) {
            userTable.innerHTML = stats.users.map(user => `
                <tr>
                    <td width="60px">
                        <div class="imgBx"><img src="./images/digitalmarketing.png" alt="User"></div>
                    </td>
                    <td>
                        <h4>${user.name}<br><span>${user.role}</span></h4>
                    </td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
};

document.addEventListener('DOMContentLoaded', fetchDashboardStats);
