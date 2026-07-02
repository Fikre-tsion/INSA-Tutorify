// Dashboard Logic
async function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();

        // Update cards
        const cardNumbers = document.querySelectorAll('.cardBox .numbers');
        if (cardNumbers.length >= 4) {
            cardNumbers[0].textContent = data.views.toLocaleString();
            cardNumbers[1].textContent = data.courseCount;
            cardNumbers[2].textContent = data.messageCount;
            cardNumbers[3].textContent = data.userCount;

            // Update labels for better context
            const cardNames = document.querySelectorAll('.cardBox .cardName');
            cardNames[0].textContent = 'Total Views';
            cardNames[1].textContent = 'Courses';
            cardNames[2].textContent = 'Messages';
            cardNames[3].textContent = 'Users';
        }

        // Update recent tutors table with Users
        const usersTableBody = document.querySelector('.recentOrders table tbody');
        if (usersTableBody) {
            usersTableBody.innerHTML = '';
            data.users.forEach(user => {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = user.name;
                const tdEmail = document.createElement('td');
                tdEmail.textContent = user.email;
                const tdRole = document.createElement('td');
                tdRole.textContent = user.role;
                const tdStatus = document.createElement('td');
                tdStatus.innerHTML = '<span class="status delivered">Active</span>';

                tr.appendChild(tdName);
                tr.appendChild(tdEmail);
                tr.appendChild(tdRole);
                tr.appendChild(tdStatus);
                usersTableBody.appendChild(tr);
            });
            // Update header
            document.querySelector('.recentOrders .cardHeader h2').textContent = 'Recent Users';
        }

        // Update messages list
        const customersTable = document.querySelector('.recentCustomers table');
        if (customersTable) {
            customersTable.innerHTML = '';
            // Only show last 5 messages
            const recentMessages = data.messages.slice(-5).reverse();
            recentMessages.forEach(msg => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.width = '60px';
                tdImg.innerHTML = '<div class="imgBx"><img src="./digitalmarketing.png" alt="User" loading="lazy"></div>';

                const tdContent = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = msg.name;
                const br = document.createElement('br');
                const span = document.createElement('span');
                span.textContent = msg.message.substring(0, 30) + (msg.message.length > 30 ? '...' : '');

                h4.appendChild(br);
                h4.appendChild(span);
                tdContent.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdContent);
                customersTable.appendChild(tr);
            });
            // Update header
            document.querySelector('.recentCustomers .cardHeader h2').textContent = 'Recent Messages';
        }

    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
}

document.addEventListener('DOMContentLoaded', fetchDashboardStats);
