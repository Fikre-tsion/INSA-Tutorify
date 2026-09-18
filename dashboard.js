document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = null;
    }

    if (!token || !user || (user && user.role !== 'admin')) {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    const toggleBtn = document.querySelector('.toggle');
    const navigation = document.querySelector('.navigation');
    const main = document.querySelector('.main');

    if (toggleBtn) {
        toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
        toggleBtn.setAttribute('role', 'button');
        toggleBtn.setAttribute('tabindex', '0');
        const toggleHandler = () => {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        };
        toggleBtn.addEventListener('click', toggleHandler);
        toggleBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleHandler();
            }
        });
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Session expired or unauthorized');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to fetch dashboard stats');
        }

        const data = await response.json();

        // Update card numbers safely
        const cardNumbers = document.querySelectorAll('.card .numbers');
        if (cardNumbers.length >= 4) {
            cardNumbers[0].textContent = (data.views || 0).toLocaleString();
            cardNumbers[1].textContent = (data.coursesCount || 0).toLocaleString();
            cardNumbers[2].textContent = (data.messagesCount || 0).toLocaleString();
            cardNumbers[3].textContent = (data.tutorsCount || 0).toLocaleString();
        }

        // Render Recent Messages table if messages exist, updating headers
        if (Array.isArray(data.messages) && data.messages.length > 0) {
            const recentOrdersSection = document.querySelector('.recentOrders');
            if (recentOrdersSection) {
                const headerText = recentOrdersSection.querySelector('h2');
                if (headerText) headerText.textContent = 'Recent Messages';

                const tableHead = recentOrdersSection.querySelector('thead tr');
                if (tableHead) {
                    tableHead.innerHTML = `
                        <td>Sender</td>
                        <td>Message</td>
                        <td>Date</td>
                        <td>Status</td>
                    `;
                }

                const tbody = recentOrdersSection.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = '';
                    data.messages.slice(-7).reverse().forEach(msg => {
                        const tr = document.createElement('tr');

                        const tdSender = document.createElement('td');
                        tdSender.textContent = msg.sender || 'Anonymous';

                        const tdMsg = document.createElement('td');
                        tdMsg.textContent = msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message;

                        const tdDate = document.createElement('td');
                        tdDate.textContent = msg.date || 'Today';

                        const tdStatus = document.createElement('td');
                        const statusSpan = document.createElement('span');
                        statusSpan.className = 'status pending';
                        statusSpan.textContent = msg.status || 'Pending';
                        tdStatus.appendChild(statusSpan);

                        tr.appendChild(tdSender);
                        tr.appendChild(tdMsg);
                        tr.appendChild(tdDate);
                        tr.appendChild(tdStatus);

                        tbody.appendChild(tr);
                    });
                }
            }
        }

        // Fallback for avatar images in recent customers table
        const customerImages = document.querySelectorAll('.recentCustomers img, .user img');
        customerImages.forEach(img => {
            img.onerror = () => {
                img.src = './images/digitalmarketing.png';
            };
        });

    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
