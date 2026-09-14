document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

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
            console.error('Failed to fetch dashboard stats');
            return;
        }

        const stats = await response.json();

        // Update cards with live metrics
        const cardNumbers = document.querySelectorAll('.cardBox .card .numbers');
        const cardNames = document.querySelectorAll('.cardBox .card .cardName');

        if (cardNumbers.length >= 4) {
            cardNumbers[0].textContent = (stats.views || 0).toLocaleString();
            cardNumbers[1].textContent = (stats.tutorials || 0).toLocaleString();
            cardNumbers[2].textContent = (stats.comments || 0).toLocaleString();
            cardNumbers[3].textContent = (stats.usersCount || 0).toLocaleString();
        }

        if (cardNames.length >= 4) {
            cardNames[3].textContent = 'Total Users';
        }

        // Update Recent Messages table
        const recentOrdersContainer = document.querySelector('.recentOrders');
        if (recentOrdersContainer && stats.messages) {
            const cardHeader = recentOrdersContainer.querySelector('.cardHeader h2');
            if (cardHeader) {
                cardHeader.textContent = 'Recent Messages';
            }

            const table = recentOrdersContainer.querySelector('table');
            if (table) {
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
                    if (stats.messages.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No messages received yet.</td></tr>';
                    } else {
                        stats.messages.slice(-10).reverse().forEach(msg => {
                            const tr = document.createElement('tr');

                            const tdSender = document.createElement('td');
                            tdSender.textContent = `${msg.firstName} ${msg.lastName}`.trim();

                            const tdMsg = document.createElement('td');
                            tdMsg.textContent = msg.message;

                            const tdDate = document.createElement('td');
                            tdDate.textContent = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'N/A';

                            const tdStatus = document.createElement('td');
                            tdStatus.innerHTML = '<span class="status delivered">Received</span>';

                            tr.appendChild(tdSender);
                            tr.appendChild(tdMsg);
                            tr.appendChild(tdDate);
                            tr.appendChild(tdStatus);

                            tbody.appendChild(tr);
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
});
