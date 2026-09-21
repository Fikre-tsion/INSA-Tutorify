document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
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
            throw new Error('Failed to load dashboard data');
        }

        const data = await response.json();
        renderDashboard(data);
    } catch (err) {
        console.error('Error fetching admin stats:', err);
    }
});

function renderDashboard(data) {
    if (data.stats) {
        const cardNumbers = document.querySelectorAll('.cardBox .card .numbers');
        if (cardNumbers.length >= 4) {
            cardNumbers[0].textContent = (data.stats.pageViews || 0).toLocaleString();
            cardNumbers[1].textContent = (data.stats.tutorials || 0).toLocaleString();
            cardNumbers[2].textContent = (data.stats.comments || 0).toLocaleString();
            cardNumbers[3].textContent = (data.stats.earnings || 0).toLocaleString();
        }
    }

    if (data.messages && Array.isArray(data.messages)) {
        const tableBody = document.querySelector('.recentOrders table tbody');
        if (tableBody && data.messages.length > 0) {
            tableBody.innerHTML = '';
            data.messages.forEach(msg => {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || 'Anonymous';

                const tdMsg = document.createElement('td');
                tdMsg.textContent = msg.message;

                const tdDate = document.createElement('td');
                tdDate.textContent = msg.date || 'N/A';

                const tdStatus = document.createElement('td');
                const spanStatus = document.createElement('span');
                spanStatus.className = 'status pending';
                spanStatus.textContent = msg.status || 'Pending';
                tdStatus.appendChild(spanStatus);

                tr.appendChild(tdName);
                tr.appendChild(tdMsg);
                tr.appendChild(tdDate);
                tr.appendChild(tdStatus);

                tableBody.appendChild(tr);
            });
        }
    }
}
