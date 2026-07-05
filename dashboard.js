document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Fetch stats
    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();

            // Update stat cards safely
            document.getElementById('stat-views').textContent = data.views.toLocaleString();
            document.getElementById('stat-courses').textContent = data.courseCount;
            document.getElementById('stat-messages').textContent = data.messageCount;
            document.getElementById('stat-users').textContent = data.userCount;

            // Render messages table safely
            const messagesBody = document.getElementById('messages-body');
            if (messagesBody) {
                messagesBody.innerHTML = ''; // Clear
                data.messages.forEach(msg => {
                    const tr = document.createElement('tr');

                    const tdName = document.createElement('td');
                    tdName.textContent = msg.name;
                    tr.appendChild(tdName);

                    const tdEmail = document.createElement('td');
                    tdEmail.textContent = msg.email;
                    tr.appendChild(tdEmail);

                    const tdMsg = document.createElement('td');
                    tdMsg.textContent = msg.message;
                    tdMsg.style.cssText = "max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
                    tr.appendChild(tdMsg);

                    const tdStatus = document.createElement('td');
                    const span = document.createElement('span');
                    span.className = "status delivered";
                    span.textContent = "New";
                    tdStatus.appendChild(span);
                    tr.appendChild(tdStatus);

                    messagesBody.appendChild(tr);
                });
            }

            // Render users table safely
            const usersBody = document.getElementById('users-body');
            if (usersBody) {
                usersBody.innerHTML = '';
                data.users.forEach(u => {
                    const tr = document.createElement('tr');

                    const tdImg = document.createElement('td');
                    tdImg.width = "60px";
                    const divImg = document.createElement('div');
                    divImg.className = "imgBx";
                    const img = document.createElement('img');
                    img.src = "./digitalmarketing.png";
                    img.alt = "User";
                    divImg.appendChild(img);
                    tdImg.appendChild(divImg);
                    tr.appendChild(tdImg);

                    const tdInfo = document.createElement('td');
                    const h4 = document.createElement('h4');
                    h4.textContent = u.name;
                    const br = document.createElement('br');
                    h4.appendChild(br);
                    const spanRole = document.createElement('span');
                    spanRole.textContent = u.role;
                    h4.appendChild(spanRole);
                    tdInfo.appendChild(h4);
                    tr.appendChild(tdInfo);

                    usersBody.appendChild(tr);
                });
            }
        }
    } catch (e) {
        console.error('Failed to fetch dashboard stats', e);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Sidebar toggle logic
let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

if (toggle) {
    toggle.onclick = function() {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    }
}
