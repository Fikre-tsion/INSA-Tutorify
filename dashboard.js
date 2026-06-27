async function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Access denied. Redirecting to login.');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();

        // Update Stats Cards
        const statViews = document.getElementById('stat-views');
        const statCourses = document.getElementById('stat-courses');
        const statMessages = document.getElementById('stat-messages');
        const statUsers = document.getElementById('stat-users');

        if (statViews) statViews.textContent = data.views.toLocaleString();
        if (statCourses) statCourses.textContent = data.courseCount;
        if (statMessages) statMessages.textContent = data.messageCount;
        if (statUsers) statUsers.textContent = data.userCount;

        // Update Messages Table - SECURITY: Mitigate XSS
        const messagesTableBody = document.querySelector('.recentOrders table tbody');
        if (messagesTableBody) {
            messagesTableBody.innerHTML = '';
            if (data.messages.length > 0) {
                data.messages.forEach(msg => {
                    const tr = document.createElement('tr');

                    const tdName = document.createElement('td');
                    tdName.textContent = msg.name;

                    const tdMsg = document.createElement('td');
                    tdMsg.textContent = msg.message.substring(0, 30) + (msg.message.length > 30 ? '...' : '');

                    const tdEmail = document.createElement('td');
                    tdEmail.textContent = msg.email;

                    const tdStatus = document.createElement('td');
                    const span = document.createElement('span');
                    span.className = 'status delivered';
                    span.textContent = 'New';
                    tdStatus.appendChild(span);

                    tr.appendChild(tdName);
                    tr.appendChild(tdMsg);
                    tr.appendChild(tdEmail);
                    tr.appendChild(tdStatus);
                    messagesTableBody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 4;
                td.textContent = 'No messages yet.';
                tr.appendChild(td);
                messagesTableBody.appendChild(tr);
            }
        }

        // Update Users List - SECURITY: Mitigate XSS
        const usersContainer = document.getElementById('users-list');
        if (usersContainer) {
            usersContainer.innerHTML = '';
            data.users.forEach(u => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.width = '60px';
                const imgBx = document.createElement('div');
                imgBx.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './images2/image.png';
                img.alt = 'User';
                imgBx.appendChild(img);
                tdImg.appendChild(imgBx);

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
                usersContainer.appendChild(tr);
            });
        }

    } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
    }
}

document.addEventListener('DOMContentLoaded', fetchDashboardStats);
