document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) user = JSON.parse(userStr);
    } catch (e) {}

    if (!token || !user || (user && user.role !== 'admin')) {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                alert('Session expired or unauthorized. Please login again.');
                window.location.href = 'login.html';
                return;
            }
            return;
        }

        const stats = await res.json();

        const viewsEl = document.getElementById('stat-views');
        if (viewsEl) viewsEl.textContent = Number(stats.views || 0).toLocaleString();

        const coursesEl = document.getElementById('stat-courses');
        if (coursesEl) coursesEl.textContent = Number(stats.courseCount || 0).toLocaleString();

        const messagesEl = document.getElementById('stat-messages');
        if (messagesEl) messagesEl.textContent = Number(stats.messageCount || 0).toLocaleString();

        const usersEl = document.getElementById('stat-users');
        if (usersEl) usersEl.textContent = Number(stats.userCount || 0).toLocaleString();

        // Render Recent Messages Table
        const messagesTableBody = document.querySelector('.recentOrders table tbody');
        if (messagesTableBody && Array.isArray(stats.messages)) {
            messagesTableBody.innerHTML = '';

            if (stats.messages.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 4;
                td.textContent = 'No recent messages.';
                tr.appendChild(td);
                messagesTableBody.appendChild(tr);
            } else {
                stats.messages.slice(-10).reverse().forEach(msg => {
                    const tr = document.createElement('tr');

                    const tdSender = document.createElement('td');
                    const fullName = `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.email || 'Anonymous';
                    tdSender.textContent = fullName;

                    const tdMsg = document.createElement('td');
                    tdMsg.textContent = msg.message || '';

                    const tdDate = document.createElement('td');
                    tdDate.textContent = msg.date ? new Date(msg.date).toLocaleDateString() : 'N/A';

                    const tdStatus = document.createElement('td');
                    const spanStatus = document.createElement('span');
                    spanStatus.className = 'status delivered';
                    spanStatus.textContent = 'Received';
                    tdStatus.appendChild(spanStatus);

                    tr.appendChild(tdSender);
                    tr.appendChild(tdMsg);
                    tr.appendChild(tdDate);
                    tr.appendChild(tdStatus);

                    messagesTableBody.appendChild(tr);
                });
            }
        }

        // Render Recent Users
        const customersTable = document.querySelector('.recentCustomers table');
        if (customersTable && Array.isArray(stats.users)) {
            customersTable.innerHTML = '';

            if (stats.users.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.textContent = 'No registered users.';
                tr.appendChild(td);
                customersTable.appendChild(tr);
            } else {
                stats.users.slice(-10).reverse().forEach(usr => {
                    const tr = document.createElement('tr');

                    const tdImg = document.createElement('td');
                    tdImg.style.width = '60px';
                    const imgBx = document.createElement('div');
                    imgBx.className = 'imgBx';
                    const img = document.createElement('img');
                    img.src = './images2/student.png';
                    img.alt = usr.name || 'User';
                    img.onerror = () => { img.src = './images/digitalmarketing.png'; };
                    imgBx.appendChild(img);
                    tdImg.appendChild(imgBx);

                    const tdInfo = document.createElement('td');
                    const h4 = document.createElement('h4');
                    h4.textContent = usr.name || 'User';
                    const br = document.createElement('br');
                    const spanRole = document.createElement('span');
                    spanRole.textContent = usr.email || usr.role;

                    h4.appendChild(br);
                    h4.appendChild(spanRole);
                    tdInfo.appendChild(h4);

                    tr.appendChild(tdImg);
                    tr.appendChild(tdInfo);

                    customersTable.appendChild(tr);
                });
            }
        }

    } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
    }
});
