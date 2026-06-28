const updateDashboard = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();

        // Update stats cards
        const numbers = document.querySelectorAll('.cardBox .numbers');
        if (numbers.length >= 4) {
            numbers[0].textContent = data.views.toLocaleString();
            numbers[1].textContent = data.courseCount;
            numbers[2].textContent = data.messageCount;
            numbers[3].textContent = data.userCount;

            // Update labels if needed
            const cardNames = document.querySelectorAll('.cardBox .cardName');
            cardNames[0].textContent = 'Total Views';
            cardNames[1].textContent = 'Courses';
            cardNames[2].textContent = 'Messages';
            cardNames[3].textContent = 'Users';
        }

        // Update Users Table
        const userTableBody = document.querySelector('.details .recentOrders tbody');
        if (userTableBody) {
            document.querySelector('.details .recentOrders h2').textContent = 'Recent Users';
            const userTableHeader = document.querySelector('.details .recentOrders thead tr');
            userTableHeader.innerHTML = '<td>Name</td><td>Email</td><td>Role</td><td>Status</td>';

            userTableBody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td><span class="status delivered">Active</span></td>
                </tr>
            `).join('');
        }

        // Update Recent Messages
        const messageTableBody = document.querySelector('.recentCustomers table');
        if (messageTableBody) {
            document.querySelector('.recentCustomers .cardHeader h2').textContent = 'Recent Messages';
            messageTableBody.innerHTML = data.messages.map(msg => `
                <tr>
                    <td width="60px">
                        <div class="imgBx"><img src="./images2/student.png" alt="User"></div>
                    </td>
                    <td>
                        <h4>${msg.name}<br><span>${msg.message.substring(0, 30)}${msg.message.length > 30 ? '...' : ''}</span></h4>
                    </td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
};

document.addEventListener('DOMContentLoaded', updateDashboard);
