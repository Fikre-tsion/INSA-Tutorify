// Dashboard JS - Centralized statistics loading and dynamic rendering
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Null-guard authentication check
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
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
            return;
        }

        const data = await response.json();

        // Update statistics cards safely
        const cards = document.querySelectorAll('.cardBox .card .numbers');
        if (cards.length >= 4) {
            cards[0].textContent = (data.pageViews || 1504).toLocaleString();
            cards[1].textContent = (data.courseCount || 18).toLocaleString();
            cards[2].textContent = (data.messageCount || 0).toLocaleString();
            cards[3].textContent = (data.userCount || 0).toLocaleString();
        }

        // Render Recent Messages in recent orders/tutors table safely using textContent to mitigate XSS
        const messagesTableBody = document.querySelector('.recentOrders table tbody');
        if (messagesTableBody && Array.isArray(data.messages) && data.messages.length > 0) {
            messagesTableBody.innerHTML = '';
            data.messages.forEach(msg => {
                const tr = document.createElement('tr');

                const tdSender = document.createElement('td');
                tdSender.textContent = msg.sender || msg.email || 'Anonymous';

                const tdMessage = document.createElement('td');
                tdMessage.textContent = msg.message || '';

                const tdDate = document.createElement('td');
                tdDate.textContent = msg.date || new Date().toLocaleDateString();

                const tdStatus = document.createElement('td');
                const spanStatus = document.createElement('span');
                spanStatus.className = 'status delivered';
                spanStatus.textContent = msg.status || 'Delivered';
                tdStatus.appendChild(spanStatus);

                tr.appendChild(tdSender);
                tr.appendChild(tdMessage);
                tr.appendChild(tdDate);
                tr.appendChild(tdStatus);

                messagesTableBody.appendChild(tr);
            });
        }

        // Render Recent Users in recent customers table
        const customersTable = document.querySelector('.recentCustomers table');
        if (customersTable && Array.isArray(data.recentUsers) && data.recentUsers.length > 0) {
            customersTable.innerHTML = '';
            data.recentUsers.forEach(u => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.style.width = '60px';
                const imgBx = document.createElement('div');
                imgBx.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './digitalmarketing.png'; // Fallback avatar image
                img.alt = u.name || 'User';
                img.loading = 'lazy';
                imgBx.appendChild(img);
                tdImg.appendChild(imgBx);

                const tdInfo = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = u.name || u.email;
                const span = document.createElement('span');
                span.textContent = `Role: ${u.role || 'user'}`;
                h4.appendChild(document.createElement('br'));
                h4.appendChild(span);
                tdInfo.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdInfo);
                customersTable.appendChild(tr);
            });
        }

    } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
    }
});
