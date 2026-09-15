async function loadDashboardData() {
    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = null;
    }

    if (!token || !user || (user && user.role !== 'admin')) {
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to load dashboard statistics.');
            return;
        }

        const data = await response.json();

        // Update Stat Cards
        const cardNumbers = document.querySelectorAll('.cardBox .card .numbers');
        if (cardNumbers.length >= 4) {
            cardNumbers[0].textContent = (data.pageViews || 0).toLocaleString();
            cardNumbers[1].textContent = (data.courseCount || 0).toLocaleString();
            cardNumbers[2].textContent = (data.messageCount || 0).toLocaleString();
            cardNumbers[3].textContent = (data.userCount || 0).toLocaleString();
        }

        // Render Recent Messages Table
        const recentOrdersContainer = document.querySelector('.recentOrders');
        if (recentOrdersContainer && data.messages) {
            const table = recentOrdersContainer.querySelector('table');
            if (table) {
                // Ensure correct header
                const thead = table.querySelector('thead');
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

                const tbody = table.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = '';
                    const recentMessages = [...data.messages].reverse().slice(0, 7);

                    if (recentMessages.length === 0) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `<td colspan="4" style="text-align:center; padding: 1rem;">No recent messages</td>`;
                        tbody.appendChild(tr);
                    } else {
                        recentMessages.forEach(msg => {
                            const tr = document.createElement('tr');

                            const tdSender = document.createElement('td');
                            tdSender.textContent = `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.email;

                            const tdMessage = document.createElement('td');
                            tdMessage.textContent = msg.message || '';

                            const tdDate = document.createElement('td');
                            const dateStr = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Recent';
                            tdDate.textContent = dateStr;

                            const tdStatus = document.createElement('td');
                            const statusSpan = document.createElement('span');
                            statusSpan.className = 'status delivered';
                            statusSpan.textContent = 'Received';
                            tdStatus.appendChild(statusSpan);

                            tr.appendChild(tdSender);
                            tr.appendChild(tdMessage);
                            tr.appendChild(tdDate);
                            tr.appendChild(tdStatus);

                            tbody.appendChild(tr);
                        });
                    }
                }
            }
        }

        // Render Recent Users
        const recentCustomersContainer = document.querySelector('.recentCustomers table');
        if (recentCustomersContainer && data.users) {
            recentCustomersContainer.innerHTML = '';
            const recentUsers = [...data.users].reverse().slice(0, 5);

            recentUsers.forEach(u => {
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

                const tdInfo = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = u.name || u.email;
                const br = document.createElement('br');
                const span = document.createElement('span');
                span.textContent = u.role ? `Role: ${u.role}` : u.email;
                h4.appendChild(br);
                h4.appendChild(span);
                tdInfo.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdInfo);

                recentCustomersContainer.appendChild(tr);
            });
        }

    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadDashboardData);
