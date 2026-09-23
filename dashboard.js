function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

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
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();

        // Update card metrics
        const numbersList = document.querySelectorAll('.cardBox .card .numbers');
        if (numbersList.length >= 4) {
            numbersList[0].textContent = (data.views || 0).toLocaleString();
            numbersList[1].textContent = (data.courseCount || 0).toLocaleString();
            numbersList[2].textContent = (data.messageCount || 0).toLocaleString();
            numbersList[3].textContent = (data.userCount || 0).toLocaleString();
        }

        // Update Recent Messages / Orders Table
        const recentOrdersTable = document.querySelector('.recentOrders table');
        if (recentOrdersTable && Array.isArray(data.messages)) {
            // Update table headers to accurately reflect contact messages
            const thead = recentOrdersTable.querySelector('thead');
            if (thead) {
                thead.innerHTML = `
                    <tr>
                        <td>Sender</td>
                        <td>Message</td>
                        <td>Date</td>
                        <td>Status</td>
                    </tr>
                `;
            }

            const tbody = recentOrdersTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '';
                if (data.messages.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4">No messages yet</td></tr>';
                } else {
                    data.messages.forEach(msg => {
                        const tr = document.createElement('tr');
                        const formattedDate = msg.date ? new Date(msg.date).toLocaleDateString() : 'N/A';
                        tr.innerHTML = `
                            <td>${escapeHTML(msg.name)}</td>
                            <td>${escapeHTML(msg.message)}</td>
                            <td>${escapeHTML(formattedDate)}</td>
                            <td><span class="status delivered">Received</span></td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            }
        }

        // Update Recent Users / Customers
        const recentCustomersTable = document.querySelector('.recentCustomers table');
        if (recentCustomersTable && Array.isArray(data.users)) {
            recentCustomersTable.innerHTML = '';
            data.users.forEach((u, index) => {
                const tr = document.createElement('tr');
                const imgPath = `./images2/${(index % 5) + 1}.jpg`;
                tr.innerHTML = `
                    <td width="60px">
                        <div class="imgBx">
                            <img src="${imgPath}" alt="User Avatar" onerror="this.src='./digitalmarketing.png'">
                        </div>
                    </td>
                    <td>
                        <h4>${escapeHTML(u.name)}<br><span>${escapeHTML(u.email)}</span></h4>
                    </td>
                `;
                recentCustomersTable.appendChild(tr);
            });
        }

    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
});
