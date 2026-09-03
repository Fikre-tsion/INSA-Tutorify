// Centralized logic for fetching statistics from /api/stats and rendering the admin dashboard tables

async function loadDashboardStats() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'admin') {
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch stats');
            return;
        }

        const stats = await response.json();

        // Update card metrics
        const viewsEl = document.getElementById('stat-views');
        if (viewsEl) viewsEl.textContent = Number(stats.views || 0).toLocaleString();

        const coursesEl = document.getElementById('stat-courses');
        if (coursesEl) coursesEl.textContent = Number(stats.courseCount || 0).toLocaleString();

        const messagesEl = document.getElementById('stat-messages');
        if (messagesEl) messagesEl.textContent = Number(stats.messageCount || 0).toLocaleString();

        const usersEl = document.getElementById('stat-users');
        if (usersEl) usersEl.textContent = Number(stats.userCount || 0).toLocaleString();

        // Render Recent Messages table dynamically using textContent to mitigate XSS
        const messagesTableBody = document.querySelector('.recentOrders tbody');
        if (messagesTableBody && Array.isArray(stats.messages)) {
            messagesTableBody.innerHTML = '';
            if (stats.messages.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 4;
                td.textContent = 'No messages received yet.';
                tr.appendChild(td);
                messagesTableBody.appendChild(tr);
            } else {
                stats.messages.slice(-10).reverse().forEach(msg => {
                    const tr = document.createElement('tr');

                    const tdSender = document.createElement('td');
                    tdSender.textContent = `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.email;

                    const tdMsg = document.createElement('td');
                    tdMsg.textContent = msg.message;

                    const tdDate = document.createElement('td');
                    tdDate.textContent = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Today';

                    const tdStatus = document.createElement('td');
                    const spanStatus = document.createElement('span');
                    spanStatus.className = 'status delivered';
                    spanStatus.textContent = msg.status || 'Received';
                    tdStatus.appendChild(spanStatus);

                    tr.appendChild(tdSender);
                    tr.appendChild(tdMsg);
                    tr.appendChild(tdDate);
                    tr.appendChild(tdStatus);

                    messagesTableBody.appendChild(tr);
                });
            }
        }

        // Render Recent Users table dynamically
        const customersTable = document.querySelector('.recentCustomers table');
        if (customersTable && Array.isArray(stats.users)) {
            customersTable.innerHTML = '';
            stats.users.slice(-5).reverse().forEach(usr => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.style.width = '60px';
                const imgBx = document.createElement('div');
                imgBx.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './digitalmarketing.png';
                img.alt = usr.name;
                img.onerror = function() { this.src = './digitalmarketing.png'; };
                imgBx.appendChild(img);
                tdImg.appendChild(imgBx);

                const tdInfo = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = usr.name;
                const spanRole = document.createElement('span');
                spanRole.textContent = ` (${usr.role})`;
                spanRole.style.fontSize = '0.85em';
                spanRole.style.color = '#888';
                h4.appendChild(document.createElement('br'));
                h4.appendChild(spanRole);
                tdInfo.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdInfo);
                customersTable.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadDashboardStats);
