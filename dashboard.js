document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetchStats();

    async function fetchStats() {
        try {
            const response = await fetch('/api/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                updateDashboard(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }

    function updateDashboard(data) {
        // Update Cards
        const cardBox = document.querySelector('.cardBox');
        if (cardBox) {
            const cards = cardBox.querySelectorAll('.card');
            if (cards.length >= 4) {
                cards[0].querySelector('.numbers').textContent = data.views.toLocaleString();
                cards[1].querySelector('.numbers').textContent = data.courseCount;
                cards[2].querySelector('.numbers').textContent = data.messageCount;
                cards[3].querySelector('.numbers').textContent = data.userCount;

                // Update names for clarity
                cards[2].querySelector('.cardName').textContent = 'Messages';
                cards[3].querySelector('.cardName').textContent = 'Total Users';
            }
        }

        // Update Messages Table
        const recentOrdersTable = document.querySelector('.recentOrders table tbody');
        if (recentOrdersTable) {
            recentOrdersTable.innerHTML = '';
            if (data.messages.length === 0) {
                recentOrdersTable.innerHTML = '<tr><td colspan="4">No messages yet.</td></tr>';
            } else {
                data.messages.slice(-7).reverse().forEach(msg => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${msg.name}</td>
                        <td>Contact Message</td>
                        <td>${msg.email}</td>
                        <td><span class="status delivered">New</span></td>
                    `;
                    recentOrdersTable.appendChild(tr);
                });
            }
            // Update table header for context
            const cardHeaderH2 = document.querySelector('.recentOrders .cardHeader h2');
            if (cardHeaderH2) cardHeaderH2.textContent = 'Recent Messages';
        }

        // Update Users Table
        const recentCustomersTable = document.querySelector('.recentCustomers table');
        if (recentCustomersTable) {
            recentCustomersTable.innerHTML = '<tr><td colspan="2"><h4>Recent Users</h4></td></tr>';
            data.users.slice(-5).reverse().forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td width="60px">
                        <div class="imgBx"><img src="./digitalmarketing.png" alt="User"></div>
                    </td>
                    <td>
                        <h4>${u.name}<br><span>${u.role}</span></h4>
                    </td>
                `;
                recentCustomersTable.appendChild(tr);
            });
        }
    }
});
