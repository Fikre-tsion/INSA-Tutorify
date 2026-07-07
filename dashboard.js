// Admin Dashboard Logic
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Fetch Stats
    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Unauthorized');
        const data = await response.json();

        // Update stats cards
        const statsSelectors = ['.cardBox .card:nth-child(1) .numbers', '.cardBox .card:nth-child(2) .numbers', '.cardBox .card:nth-child(3) .numbers', '.cardBox .card:nth-child(4) .numbers'];
        const statsValues = [data.views.toLocaleString(), data.courseCount, data.messageCount, data.userCount];

        statsSelectors.forEach((selector, index) => {
            const el = document.querySelector(selector);
            if (el) el.textContent = statsValues[index];
        });

        // Render Messages Table
        const recentOrdersTableBody = document.querySelector('.recentOrders table tbody');
        if (recentOrdersTableBody && data.messages.length > 0) {
            recentOrdersTableBody.innerHTML = '';
            data.messages.slice(-10).reverse().forEach(msg => {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = msg.name;
                const tdEmail = document.createElement('td');
                tdEmail.textContent = msg.email;
                const tdDate = document.createElement('td');
                tdDate.textContent = new Date(msg.date).toLocaleDateString();
                const tdStatus = document.createElement('td');
                tdStatus.innerHTML = '<span class="status delivered">Received</span>';

                tr.appendChild(tdName);
                tr.appendChild(tdEmail);
                tr.appendChild(tdDate);
                tr.appendChild(tdStatus);
                recentOrdersTableBody.appendChild(tr);
            });
        }

        // Render Users Table
        const recentCustomersTable = document.querySelector('.recentCustomers table');
        if (recentCustomersTable && data.users.length > 0) {
            recentCustomersTable.innerHTML = '';
            data.users.slice(-10).reverse().forEach(u => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.setAttribute('width', '60px');
                tdImg.innerHTML = '<div class="imgBx"><img src="./images/digitalmarketing.png" alt="User"></div>';

                const tdInfo = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = u.name;
                const br = document.createElement('br');
                const span = document.createElement('span');
                span.textContent = u.role;
                h4.appendChild(br);
                h4.appendChild(span);
                tdInfo.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdInfo);
                recentCustomersTable.appendChild(tr);
            });
        }

    } catch (err) {
        console.error('Dashboard error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
});

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

// Toggle logic
let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

if (toggle) {
    toggle.onclick = function() {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    }
}
