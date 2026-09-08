document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || (user && user.role !== 'admin')) {
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
            throw new Error('Failed to fetch stats');
        }

        const data = await response.json();

        // Update card numbers
        const numbers = document.querySelectorAll('.cardBox .card .numbers');
        if (numbers.length >= 4) {
            numbers[0].textContent = (data.pageViews || 0).toLocaleString();
            numbers[1].textContent = (data.tutorialsCount || 0).toLocaleString();
            numbers[2].textContent = (data.messagesCount || 0).toLocaleString();
            numbers[3].textContent = 'ETB ' + (data.earnings || 7842).toLocaleString();
        }

        // Render messages / recent activity table securely
        const tableBody = document.querySelector('.recentOrders table tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
            const messages = data.messages || [];

            if (messages.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 4;
                td.style.textAlign = 'center';
                td.textContent = 'No messages received yet.';
                tr.appendChild(td);
                tableBody.appendChild(tr);
            } else {
                messages.forEach(msg => {
                    const tr = document.createElement('tr');

                    const tdSender = document.createElement('td');
                    tdSender.textContent = `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.email;

                    const tdMessage = document.createElement('td');
                    tdMessage.textContent = msg.message || '';

                    const tdDate = document.createElement('td');
                    tdDate.textContent = msg.date || '';

                    const tdStatus = document.createElement('td');
                    const spanStatus = document.createElement('span');
                    spanStatus.className = 'status delivered';
                    spanStatus.textContent = msg.status || 'Received';
                    tdStatus.appendChild(spanStatus);

                    tr.appendChild(tdSender);
                    tr.appendChild(tdMessage);
                    tr.appendChild(tdDate);
                    tr.appendChild(tdStatus);

                    tableBody.appendChild(tr);
                });
            }
        }

        // Render recent users in recentCustomers
        const customerTable = document.querySelector('.recentCustomers table');
        if (customerTable && Array.isArray(data.users)) {
            customerTable.innerHTML = '';
            data.users.slice(0, 5).forEach(u => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.style.width = '60px';
                const imgBx = document.createElement('div');
                imgBx.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './images/digitalmarketing.png';
                img.alt = u.name || 'User';
                img.onerror = function() { this.src = './images/digitalmarketing.png'; };
                imgBx.appendChild(img);
                tdImg.appendChild(imgBx);

                const tdInfo = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = u.name || 'User';
                const br = document.createElement('br');
                const span = document.createElement('span');
                span.textContent = u.role || 'User';
                h4.appendChild(br);
                h4.appendChild(span);
                tdInfo.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdInfo);
                customerTable.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
