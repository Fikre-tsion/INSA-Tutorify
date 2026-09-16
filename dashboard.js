// Check admin authentication with null-guards
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
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Navigation sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.toggle');
    const navigation = document.querySelector('.navigation');
    const main = document.querySelector('.main');

    if (toggle && navigation && main) {
        toggle.addEventListener('click', () => {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        });
    }

    document.querySelectorAll('.navigation ul li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
            li.classList.add('hovered');
        });
    });

    fetchDashboardStats();
});

function fetchDashboardStats() {
    fetch('/api/stats', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    })
    .then(data => {
        // Update metric cards
        const cards = document.querySelectorAll('.cardBox .card');
        if (cards && cards.length >= 4) {
            cards[0].querySelector('.numbers').textContent = (data.views || 0).toLocaleString();
            cards[0].querySelector('.cardName').textContent = 'Profile Views';

            cards[1].querySelector('.numbers').textContent = (data.totalCourses || 0).toLocaleString();
            cards[1].querySelector('.cardName').textContent = 'Courses';

            cards[2].querySelector('.numbers').textContent = (data.totalUsers || 0).toLocaleString();
            cards[2].querySelector('.cardName').textContent = 'Registered Users';

            cards[3].querySelector('.numbers').textContent = (data.totalMessages || 0).toLocaleString();
            cards[3].querySelector('.cardName').textContent = 'Messages';
        }

        // Update Messages Table in recentOrders card
        const tableHeaderTr = document.querySelector('.recentOrders table thead tr');
        if (tableHeaderTr) {
            tableHeaderTr.innerHTML = '<td>Sender</td><td>Message</td><td>Date</td><td>Status</td>';
        }

        const tbody = document.querySelector('.recentOrders table tbody');
        if (tbody && data.messages) {
            tbody.innerHTML = '';
            const recentMsgs = data.messages.slice(-10).reverse();
            if (recentMsgs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No messages received yet.</td></tr>';
            } else {
                recentMsgs.forEach(msg => {
                    const tr = document.createElement('tr');

                    const tdName = document.createElement('td');
                    tdName.textContent = msg.name || 'Anonymous';

                    const tdMsg = document.createElement('td');
                    tdMsg.textContent = msg.message ? (msg.message.length > 40 ? msg.message.substring(0, 40) + '...' : msg.message) : '';

                    const tdDate = document.createElement('td');
                    const msgDate = msg.date ? new Date(msg.date).toLocaleDateString() : 'N/A';
                    tdDate.textContent = msgDate;

                    const tdStatus = document.createElement('td');
                    const span = document.createElement('span');
                    span.className = 'status delivered';
                    span.textContent = 'Received';
                    tdStatus.appendChild(span);

                    tr.appendChild(tdName);
                    tr.appendChild(tdMsg);
                    tr.appendChild(tdDate);
                    tr.appendChild(tdStatus);

                    tbody.appendChild(tr);
                });
            }
        }
    })
    .catch(err => {
        console.error('Error fetching admin dashboard stats:', err);
    });
}
