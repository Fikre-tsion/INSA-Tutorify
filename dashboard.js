document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        return; // Redirect handled in HTML for now
    }

    try {
        const res = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await res.json();

        // Update stats cards
        document.querySelector('.cardBox .card:nth-child(1) .numbers').textContent = stats.views.toLocaleString();
        document.querySelector('.cardBox .card:nth-child(2) .numbers').textContent = stats.courseCount;
        document.querySelector('.cardBox .card:nth-child(3) .numbers').textContent = stats.messageCount;
        document.querySelector('.cardBox .card:nth-child(4) .numbers').textContent = stats.userCount;

        // Update recent messages (using the tutors table as placeholder for now or replacing it)
        const recentMessagesTable = document.querySelector('.recentOrders tbody');
        recentMessagesTable.innerHTML = '';
        stats.messages.forEach(msg => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${msg.firstName} ${msg.lastName}</td>
                <td>${msg.message.substring(0, 30)}...</td>
                <td>${new Date(msg.date).toLocaleDateString()}</td>
                <td><span class="status delivered">New</span></td>
            `;
            recentMessagesTable.appendChild(tr);
        });

        // Update recent customers/users
        const recentUsersTable = document.querySelector('.recentCustomers table');
        recentUsersTable.innerHTML = '';
        stats.users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td width="60px"><div class="imgBx"><img src="./digitalmarketing.png" alt="User"></div></td>
                <td><h4>${u.name}<br><span>${u.email}</span></h4></td>
            `;
            recentUsersTable.appendChild(tr);
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
});
