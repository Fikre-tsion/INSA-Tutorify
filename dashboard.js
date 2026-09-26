// Centralized Admin Dashboard Logic
document.addEventListener('DOMContentLoaded', async () => {
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

        if (response.ok) {
            const data = await response.json();

            // Update stat card numbers
            const cards = document.querySelectorAll('.cardBox .card .numbers');
            if (cards.length >= 4 && data.stats) {
                cards[0].textContent = (data.stats.views || 0).toLocaleString();
                cards[1].textContent = (data.stats.tutorials || 0).toLocaleString();
                cards[2].textContent = (data.stats.comments || 0).toLocaleString();
                cards[3].textContent = (data.stats.earnings || 0).toLocaleString();
            }

            // Render recent messages if present
            const messagesTableBody = document.querySelector('.recentOrders tbody');
            if (messagesTableBody && data.recentMessages && data.recentMessages.length > 0) {
                messagesTableBody.innerHTML = data.recentMessages.map(msg => `
                    <tr>
                        <td>${msg.sender}</td>
                        <td>${msg.email}</td>
                        <td>${msg.message.substring(0, 25)}${msg.message.length > 25 ? '...' : ''}</td>
                        <td><span class="status delivered">${msg.status || 'Received'}</span></td>
                    </tr>
                `).join('');

                // Update header title to reflect recent messages
                const cardHeader = document.querySelector('.recentOrders .cardHeader h2');
                if (cardHeader) cardHeader.textContent = 'Recent Messages';
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard statistics:', error);
    }
});
