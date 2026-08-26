// Fetch dynamic dashboard stats and render content safely
async function loadDashboardStats() {
    try {
        const res = await fetch('/api/stats');
        if (!res.ok) return;
        const data = await res.json();

        const cardNumbers = document.querySelectorAll('.cardBox .card .numbers');
        if (cardNumbers.length >= 4) {
            cardNumbers[0].textContent = (data.views ?? 1504).toLocaleString();
            cardNumbers[1].textContent = (data.coursesCount ?? 80).toString();
            cardNumbers[2].textContent = (data.messagesCount ?? 284).toString();
            cardNumbers[3].textContent = (data.usersCount ?? 7842).toString();
        }

        // Render recent messages safely using textContent to prevent XSS
        if (data.recentMessages && data.recentMessages.length > 0) {
            const tableBody = document.querySelector('.recentOrders table tbody');
            if (tableBody) {
                tableBody.innerHTML = '';
                data.recentMessages.forEach(msg => {
                    const row = document.createElement('tr');

                    const tdSender = document.createElement('td');
                    tdSender.textContent = `${msg.firstName || ''} ${msg.lastName || msg.email || ''}`.trim();

                    const tdMsg = document.createElement('td');
                    tdMsg.textContent = msg.message ? (msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message) : 'Inquiry';

                    const tdDate = document.createElement('td');
                    tdDate.textContent = msg.date ? new Date(msg.date).toLocaleDateString() : '';

                    const tdStatus = document.createElement('td');
                    const spanStatus = document.createElement('span');
                    spanStatus.className = 'status delivered';
                    spanStatus.textContent = 'Received';
                    tdStatus.appendChild(spanStatus);

                    row.appendChild(tdSender);
                    row.appendChild(tdMsg);
                    row.appendChild(tdDate);
                    row.appendChild(tdStatus);

                    tableBody.appendChild(row);
                });
            }
        }
    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadDashboardStats);
