const fetchStats = async () => {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        // Update card numbers
        const numbers = document.querySelectorAll('.cardBox .numbers');
        if (numbers.length >= 4) {
            numbers[0].textContent = data.views.toLocaleString();
            numbers[1].textContent = data.courses.toString();
            numbers[2].textContent = data.messages.toString();
            numbers[3].textContent = data.users.toString();
        }

        // Update Recent Users
        const recentUsersTable = document.querySelector('.recentOrders table tbody');
        if (recentUsersTable) {
            recentUsersTable.innerHTML = ''; // Clear
            data.recentUsers.forEach(user => {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = user.name;

                const tdEmail = document.createElement('td');
                tdEmail.textContent = user.email;

                const tdRole = document.createElement('td');
                tdRole.textContent = user.role;

                const tdStatus = document.createElement('td');
                const span = document.createElement('span');
                span.className = `status ${user.role === 'admin' ? 'delivered' : 'inprogress'}`;
                span.textContent = user.role;
                tdStatus.appendChild(span);

                tr.appendChild(tdName);
                tr.appendChild(tdEmail);
                tr.appendChild(tdRole);
                tr.appendChild(tdStatus);

                recentUsersTable.appendChild(tr);
            });
        }

        // Update Recent Messages
        const recentCustomersTable = document.querySelector('.recentCustomers table');
        if (recentCustomersTable) {
            recentCustomersTable.innerHTML = ''; // Clear

            const header = document.createElement('div');
            header.className = 'cardHeader';
            const h2 = document.createElement('h2');
            h2.textContent = 'Recent Messages';
            header.appendChild(h2);
            recentCustomersTable.appendChild(header);

            data.recentMessages.forEach(msg => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.style.width = '60px';
                const imgBx = document.createElement('div');
                imgBx.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './images/digitalmarketing.png';
                img.alt = 'User';
                imgBx.appendChild(img);
                tdImg.appendChild(imgBx);

                const tdInfo = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = msg.name;
                const br = document.createElement('br');
                const span = document.createElement('span');
                span.textContent = msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message;

                h4.appendChild(br);
                h4.appendChild(span);
                tdInfo.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdInfo);

                recentCustomersTable.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
});
