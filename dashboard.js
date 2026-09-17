document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || (user && user.role !== 'admin')) {
        return; // Inline script in dashboard.html handles redirect
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch dashboard stats');
            return;
        }

        const data = await response.json();

        // Update card metrics
        const cards = document.querySelectorAll('.card .numbers');
        if (cards.length >= 4) {
            cards[0].textContent = (data.views || 0).toLocaleString();
            cards[1].textContent = (data.tutorialsCount || 0).toLocaleString();
            cards[2].textContent = (data.messagesCount || 0).toLocaleString();
            cards[3].textContent = (data.usersCount || 0).toLocaleString();
        }

        // Update Messages table
        const messagesTbody = document.querySelector('.recentOrders table tbody');
        if (messagesTbody && Array.isArray(data.messages) && data.messages.length > 0) {
            messagesTbody.innerHTML = '';
            data.messages.slice(-7).reverse().forEach(msg => {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = msg.name || 'Anonymous';

                const tdMsg = document.createElement('td');
                tdMsg.textContent = msg.message || '';

                const tdDate = document.createElement('td');
                tdDate.textContent = msg.date || new Date().toISOString().split('T')[0];

                const tdStatus = document.createElement('td');
                const statusSpan = document.createElement('span');
                const statusClass = (msg.status || 'Pending').toLowerCase().replace(/\s+/g, '');
                statusSpan.className = `status ${statusClass}`;
                statusSpan.textContent = msg.status || 'Pending';
                tdStatus.appendChild(statusSpan);

                tr.appendChild(tdName);
                tr.appendChild(tdMsg);
                tr.appendChild(tdDate);
                tr.appendChild(tdStatus);

                messagesTbody.appendChild(tr);
            });

            const tableHeaderRow = document.querySelector('.recentOrders table thead tr');
            if (tableHeaderRow) {
                tableHeaderRow.innerHTML = `
                    <td>Sender</td>
                    <td>Message</td>
                    <td>Date</td>
                    <td>Status</td>
                `;
            }

            const cardHeaderTitle = document.querySelector('.recentOrders .cardHeader h2');
            if (cardHeaderTitle) {
                cardHeaderTitle.textContent = 'Recent Messages';
            }
        }

        // Update Recent Users table
        const usersTable = document.querySelector('.recentCustomers table');
        if (usersTable && Array.isArray(data.users) && data.users.length > 0) {
            usersTable.innerHTML = '';
            data.users.slice(-5).reverse().forEach(u => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.style.width = '60px';
                const imgBx = document.createElement('div');
                imgBx.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './digitalmarketing.png';
                img.alt = u.name || 'User';
                imgBx.appendChild(img);
                tdImg.appendChild(imgBx);

                const tdDetails = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = u.name;
                const span = document.createElement('span');
                span.textContent = u.role ? `Role: ${u.role}` : u.email;
                h4.appendChild(document.createElement('br'));
                h4.appendChild(span);
                tdDetails.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdDetails);

                usersTable.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Error loading admin dashboard stats:', err);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

window.logout = logout;
