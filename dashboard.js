// Admin Dashboard Logic
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Update Profile Info
    const userProfileName = document.querySelector('.user img');
    if (userProfileName) {
        userProfileName.title = user.name;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');

        const stats = await response.json();

        // Update Stats Cards
        const statCards = document.querySelectorAll('.card .numbers');
        if (statCards.length >= 4) {
            statCards[0].textContent = stats.views.toLocaleString();
            statCards[1].textContent = stats.courseCount;
            statCards[2].textContent = stats.messageCount;
            statCards[3].textContent = stats.userCount;
        }

        // Update Recent Messages/Orders Table
        const tableBody = document.querySelector('.recentOrders table tbody');
        if (tableBody && stats.messages) {
            tableBody.innerHTML = stats.messages.map(msg => `
                <tr>
                    <td>${msg.name}</td>
                    <td>${msg.message.substring(0, 30)}...</td>
                    <td>${new Date(msg.date).toLocaleDateString()}</td>
                    <td><span class="status ${msg.status.toLowerCase().replace(' ', '')}">${msg.status}</span></td>
                </tr>
            `).reverse().slice(0, 7).join('');
        }

        // Update Recent Customers/Users Table
        const customerTable = document.querySelector('.recentCustomers table');
        if (customerTable && stats.users) {
            const header = `
                <tr>
                    <div class="cardHeader">
                        <h2>Recent Users</h2>
                    </div>
                </tr>
            `;
            const rows = stats.users.reverse().slice(0, 5).map(u => `
                <tr>
                    <td width="60px">
                        <div class="imgBx"><img src="./images/avatar1.jpg" alt="User"></div>
                    </td>
                    <td>
                        <h4>${u.name}<br><span>${u.role}</span></h4>
                    </td>
                </tr>
            `).join('');
            customerTable.innerHTML = rows;
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
});

// Logout function (also handles from HTML attribute)
window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

// Sidebar Toggle
const toggle = document.querySelector('.toggle');
const navigation = document.querySelector('.navigation');
const main = document.querySelector('.main');

if (toggle && navigation && main) {
    toggle.onclick = function() {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    };
}
