document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (!token || !userJson) {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(userJson);
        if (!user || user.role !== 'admin') {
            alert('Access denied. Please login as admin.');
            window.location.href = 'login.html';
            return;
        }
    } catch (e) {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Toggle menu
    const toggle = document.querySelector('.toggle');
    const navigation = document.querySelector('.navigation');
    const main = document.querySelector('.main');

    if (toggle && navigation && main) {
        toggle.setAttribute('aria-label', 'Toggle navigation menu');
        toggle.onclick = function() {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        };
    }

    // Navigation item highlight
    document.querySelectorAll('.navigation ul li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
            li.classList.add('hovered');
        });
    });

    // Fetch and render stats with authorization header
    await loadDashboardStats(token);
});

async function loadDashboardStats(token) {
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) return;
        const data = await response.json();

        // Update metric cards
        const statViews = document.getElementById('stat-views');
        const statCourses = document.getElementById('stat-courses');
        const statMessages = document.getElementById('stat-messages');
        const statUsers = document.getElementById('stat-users');

        if (statViews) statViews.textContent = Number(data.views || 0).toLocaleString();
        if (statCourses) statCourses.textContent = Number(data.courseCount || 0).toLocaleString();
        if (statMessages) statMessages.textContent = Number(data.messageCount || 0).toLocaleString();
        if (statUsers) statUsers.textContent = Number(data.userCount || 0).toLocaleString();

        // Render messages table
        const messagesTableBody = document.querySelector('.recentOrders table tbody');
        if (messagesTableBody && Array.isArray(data.messages)) {
            messagesTableBody.innerHTML = '';
            data.messages.slice(-10).reverse().forEach(msg => {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = msg.name || msg.email || 'Anonymous';

                const tdMessage = document.createElement('td');
                tdMessage.textContent = msg.message || '';

                const tdDate = document.createElement('td');
                tdDate.textContent = msg.date || '';

                const tdStatus = document.createElement('td');
                const spanStatus = document.createElement('span');
                const statusClass = (msg.status || 'Pending').toLowerCase().replace(/\s+/g, '');
                spanStatus.className = `status ${statusClass}`;
                spanStatus.textContent = msg.status || 'Pending';
                tdStatus.appendChild(spanStatus);

                tr.appendChild(tdName);
                tr.appendChild(tdMessage);
                tr.appendChild(tdDate);
                tr.appendChild(tdStatus);

                messagesTableBody.appendChild(tr);
            });
        }

        // Render users list table
        const usersTable = document.querySelector('.recentCustomers table');
        if (usersTable && Array.isArray(data.users)) {
            usersTable.innerHTML = '';
            data.users.slice(-10).reverse().forEach(u => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.style.width = '60px';
                const imgBx = document.createElement('div');
                imgBx.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './images/digitalmarketing.png';
                img.alt = 'User Avatar';
                imgBx.appendChild(img);
                tdImg.appendChild(imgBx);

                const tdInfo = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = u.name || u.email;
                const br = document.createElement('br');
                const spanRole = document.createElement('span');
                spanRole.textContent = `Role: ${u.role}`;

                h4.appendChild(br);
                h4.appendChild(spanRole);
                tdInfo.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdInfo);

                usersTable.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
window.logout = logout;
