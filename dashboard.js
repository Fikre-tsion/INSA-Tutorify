document.addEventListener('DOMContentLoaded', async () => {
    // Authentication Check
    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = null;
    }

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Toggle navigation logic
    const toggle = document.querySelector('.toggle');
    const navigation = document.querySelector('.navigation');
    const main = document.querySelector('.main');

    if (toggle && navigation && main) {
        toggle.onclick = function() {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        };
    }

    // Hovered effect on navigation list items
    document.querySelectorAll('.navigation ul li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
            li.classList.add('hovered');
        });
    });

    // Fetch Stats and render dashboard tables
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Session expired or unauthorized. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to fetch stats');
        }

        const data = await response.json();

        // Populate card metrics
        const cardNumbers = document.querySelectorAll('.cardBox .card .numbers');
        if (cardNumbers.length >= 4) {
            cardNumbers[0].textContent = (data.stats.profileViews || 0).toLocaleString();
            cardNumbers[1].textContent = data.stats.tutorials || 0;
            cardNumbers[2].textContent = data.stats.comments || 0;
            cardNumbers[3].textContent = data.stats.earnings || "ETB 7,842";
        }

        // Render Recent Messages Table
        const recentTableBody = document.querySelector('.recentOrders table tbody');
        if (recentTableBody && Array.isArray(data.messages) && data.messages.length > 0) {
            recentTableBody.innerHTML = '';
            data.messages.slice(-7).reverse().forEach(msg => {
                const tr = document.createElement('tr');

                const tdSender = document.createElement('td');
                tdSender.textContent = msg.sender || 'Anonymous';

                const tdMsg = document.createElement('td');
                tdMsg.textContent = msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message;

                const tdDate = document.createElement('td');
                tdDate.textContent = msg.date || 'Today';

                const tdStatus = document.createElement('td');
                const spanStatus = document.createElement('span');
                spanStatus.className = 'status delivered';
                spanStatus.textContent = msg.status || 'Received';
                tdStatus.appendChild(spanStatus);

                tr.appendChild(tdSender);
                tr.appendChild(tdMsg);
                tr.appendChild(tdDate);
                tr.appendChild(tdStatus);

                recentTableBody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
});

// Global logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
