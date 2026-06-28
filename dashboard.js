document.addEventListener('DOMContentLoaded', () => {
    const fetchStats = async () => {
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

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Session expired or access denied.');
                    window.location.href = 'login.html';
                }
                return;
            }

            const data = await response.json();

            // Update stat cards
            document.getElementById('stat-views').textContent = data.stats.views.toLocaleString();
            document.getElementById('stat-courses').textContent = data.stats.courseCount;
            document.getElementById('stat-messages').textContent = data.stats.messageCount;
            document.getElementById('stat-users').textContent = data.stats.userCount;

            // Update Messages Table (Recent Tutors section repurposed)
            const messagesTableBody = document.querySelector('.recentOrders table tbody');
            if (messagesTableBody) {
                messagesTableBody.innerHTML = '';
                data.messages.forEach(msg => {
                    const tr = document.createElement('tr');

                    const nameTd = document.createElement('td');
                    nameTd.textContent = msg.name;

                    const emailTd = document.createElement('td');
                    emailTd.textContent = msg.email;

                    const dateTd = document.createElement('td');
                    dateTd.textContent = new Date(msg.date).toLocaleDateString();

                    const statusTd = document.createElement('td');
                    const span = document.createElement('span');
                    span.className = 'status delivered';
                    span.textContent = 'New';
                    statusTd.appendChild(span);

                    tr.appendChild(nameTd);
                    tr.appendChild(emailTd);
                    tr.appendChild(dateTd);
                    tr.appendChild(statusTd);

                    messagesTableBody.appendChild(tr);
                });
            }

            // Update Users Table
            const usersTable = document.querySelector('.recentCustomers table');
            if (usersTable) {
                usersTable.innerHTML = '';
                data.users.forEach(user => {
                    const tr = document.createElement('tr');

                    const imgTd = document.createElement('td');
                    imgTd.width = '60px';
                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'imgBx';
                    const img = document.createElement('img');
                    img.src = './images2/student.png'; // Placeholder for user avatar
                    img.alt = 'User';
                    imgDiv.appendChild(img);
                    imgTd.appendChild(imgDiv);

                    const infoTd = document.createElement('td');
                    const h4 = document.createElement('h4');
                    h4.textContent = user.name;
                    const br = document.createElement('br');
                    const span = document.createElement('span');
                    span.textContent = user.role;
                    h4.appendChild(br);
                    h4.appendChild(span);
                    infoTd.appendChild(h4);

                    tr.appendChild(imgTd);
                    tr.appendChild(infoTd);
                    usersTable.appendChild(tr);
                });
            }

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    fetchStats();
});
