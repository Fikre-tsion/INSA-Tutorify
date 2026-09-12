async function fetchDashboardData() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
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
            throw new Error('Failed to fetch dashboard statistics');
        }

        const data = await response.json();
        renderStats(data.stats);
        renderMessages(data.messages);
        renderUsers(data.users);
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

function renderStats(stats) {
    if (!stats) return;
    const cardNumbers = document.querySelectorAll('.cardBox .card .numbers');
    if (cardNumbers.length >= 4) {
        cardNumbers[0].textContent = (stats.views || 0).toLocaleString();
        cardNumbers[1].textContent = stats.tutorials || 18;
        cardNumbers[2].textContent = stats.comments || 284;
        cardNumbers[3].textContent = stats.earnings || 'ETB 7,842';
    }
}

function renderMessages(messages) {
    if (!messages) return;
    const tbody = document.querySelector('.recentOrders table tbody');
    if (!tbody) return;

    if (messages.length === 0) {
        return;
    }

    tbody.innerHTML = '';
    messages.slice(-10).reverse().forEach(msg => {
        const tr = document.createElement('tr');

        const tdSender = document.createElement('td');
        tdSender.textContent = msg.sender || 'Anonymous';

        const tdMsg = document.createElement('td');
        tdMsg.textContent = msg.message || '';

        const tdDate = document.createElement('td');
        tdDate.textContent = msg.date || new Date().toISOString().split('T')[0];

        const tdStatus = document.createElement('td');
        const spanStatus = document.createElement('span');
        spanStatus.className = 'status delivered';
        spanStatus.textContent = msg.status || 'Received';
        tdStatus.appendChild(spanStatus);

        tr.appendChild(tdSender);
        tr.appendChild(tdMsg);
        tr.appendChild(tdDate);
        tr.appendChild(tdStatus);

        tbody.appendChild(tr);
    });

    const thead = document.querySelector('.recentOrders table thead tr');
    if (thead) {
        thead.innerHTML = `
            <td>Sender</td>
            <td>Message</td>
            <td>Date</td>
            <td>Status</td>
        `;
    }
}

function renderUsers(users) {
    if (!users) return;
    const table = document.querySelector('.recentCustomers table');
    if (!table) return;

    if (users.length === 0) return;

    table.innerHTML = '';
    users.slice(-5).reverse().forEach(usr => {
        const tr = document.createElement('tr');

        const tdImg = document.createElement('td');
        tdImg.style.width = '60px';
        const imgBx = document.createElement('div');
        imgBx.className = 'imgBx';
        const img = document.createElement('img');
        img.src = './digitalmarketing.png';
        img.alt = usr.name;
        imgBx.appendChild(img);
        tdImg.appendChild(imgBx);

        const tdInfo = document.createElement('td');
        const h4 = document.createElement('h4');
        h4.textContent = usr.name;
        const br = document.createElement('br');
        const span = document.createElement('span');
        span.textContent = usr.role === 'admin' ? 'Administrator' : 'Student';
        h4.appendChild(br);
        h4.appendChild(span);
        tdInfo.appendChild(h4);

        tr.appendChild(tdImg);
        tr.appendChild(tdInfo);
        table.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', fetchDashboardData);
