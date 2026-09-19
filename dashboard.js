// Centralized logic for admin dashboard stats
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Null-guard check
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

        // Update Card Numbers
        const cardNumbers = document.querySelectorAll('.cardBox .numbers');
        if (cardNumbers.length >= 4) {
            cardNumbers[0].textContent = (data.stats.profileViews || 0).toLocaleString();
            cardNumbers[1].textContent = data.stats.tutorials || 0;
            cardNumbers[2].textContent = data.stats.comments || 0;
            cardNumbers[3].textContent = data.stats.earnings || 'ETB 7,842';
        }

        // Render Recent Messages table safely (preventing XSS)
        const messagesTableBody = document.querySelector('.recentOrders table tbody');
        if (messagesTableBody && data.messages) {
            messagesTableBody.innerHTML = '';
            if (data.messages.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="4" style="text-align:center;">No recent messages</td>';
                messagesTableBody.appendChild(tr);
            } else {
                data.messages.slice(-7).reverse().forEach(msg => {
                    const tr = document.createElement('tr');

                    const tdSender = document.createElement('td');
                    tdSender.textContent = `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.email;

                    const tdMessage = document.createElement('td');
                    tdMessage.textContent = msg.message;

                    const tdDate = document.createElement('td');
                    tdDate.textContent = msg.date ? new Date(msg.date).toLocaleDateString() : 'N/A';

                    const tdStatus = document.createElement('td');
                    const spanStatus = document.createElement('span');
                    spanStatus.className = 'status delivered';
                    spanStatus.textContent = 'Received';
                    tdStatus.appendChild(spanStatus);

                    tr.appendChild(tdSender);
                    tr.appendChild(tdMessage);
                    tr.appendChild(tdDate);
                    tr.appendChild(tdStatus);

                    messagesTableBody.appendChild(tr);
                });
            }
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
