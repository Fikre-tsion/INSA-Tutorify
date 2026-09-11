document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
    setupImageFallbacks();
});

async function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch stats:', response.statusText);
            return;
        }

        const data = await response.json();

        // Update Card Numbers
        const viewsEl = document.getElementById('stat-views');
        if (viewsEl) viewsEl.textContent = Number(data.views || 0).toLocaleString();

        const coursesEl = document.getElementById('stat-courses');
        if (coursesEl) coursesEl.textContent = data.coursesCount || 0;

        const messagesEl = document.getElementById('stat-messages');
        if (messagesEl) messagesEl.textContent = data.messagesCount || 0;

        const usersEl = document.getElementById('stat-users');
        if (usersEl) usersEl.textContent = data.usersCount || 0;

        // Render Recent Messages Table
        renderMessagesTable(data.messages || []);

        // Render Recent Users List
        renderUsersList(data.users || []);

    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
}

function renderMessagesTable(messages) {
    const tbody = document.querySelector('.recentOrders table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (messages.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = 'No messages received yet.';
        td.style.textAlign = 'center';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    messages.slice(-7).reverse().forEach(msg => {
        const tr = document.createElement('tr');

        const tdSender = document.createElement('td');
        tdSender.textContent = msg.name || 'Anonymous';

        const tdMsg = document.createElement('td');
        tdMsg.textContent = msg.message && msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : (msg.message || '');

        const tdDate = document.createElement('td');
        const dateObj = msg.createdAt ? new Date(msg.createdAt) : new Date();
        tdDate.textContent = dateObj.toLocaleDateString();

        const tdStatus = document.createElement('td');
        const spanStatus = document.createElement('span');
        spanStatus.className = 'status delivered';
        spanStatus.textContent = 'Received';
        tdStatus.appendChild(spanStatus);

        tr.appendChild(tdSender);
        tr.appendChild(tdMsg);
        tr.appendChild(tdDate);
        tr.appendChild(tdStatus);

        tbody.appendChild(tr);
    });
}

function renderUsersList(users) {
    const table = document.querySelector('.recentCustomers table');
    if (!table) return;

    table.innerHTML = '';
    users.slice(-5).reverse().forEach(u => {
        const tr = document.createElement('tr');

        const tdImg = document.createElement('td');
        tdImg.width = '60px';
        const imgBx = document.createElement('div');
        imgBx.className = 'imgBx';
        const img = document.createElement('img');
        img.src = './digitalmarketing.png';
        img.alt = u.name || 'User';
        imgBx.appendChild(img);
        tdImg.appendChild(imgBx);

        const tdInfo = document.createElement('td');
        const h4 = document.createElement('h4');
        h4.textContent = u.name || 'User';
        const br = document.createElement('br');
        const span = document.createElement('span');
        span.textContent = `Role: ${u.role || 'user'}`;
        h4.appendChild(br);
        h4.appendChild(span);
        tdInfo.appendChild(h4);

        tr.appendChild(tdImg);
        tr.appendChild(tdInfo);
        table.appendChild(tr);
    });
}

function setupImageFallbacks() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.onerror = () => {
            img.onerror = null;
            img.src = './digitalmarketing.png';
        };
    });
}
