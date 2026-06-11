document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    const updateStats = async () => {
        try {
            const response = await fetch('/api/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const stats = await response.json();
                const cardBox = document.querySelector('.cardBox');
                if (cardBox) {
                    cardBox.innerHTML = `
                        <div class="card">
                            <div>
                                <div class="numbers" id="stat-users">${stats.users}</div>
                                <div class="cardName">Total Users</div>
                            </div>
                            <div class="iconBx"><ion-icon name="people-outline"></ion-icon></div>
                        </div>
                        <div class="card">
                            <div>
                                <div class="numbers" id="stat-courses">${stats.courses}</div>
                                <div class="cardName">Tutorials</div>
                            </div>
                            <div class="iconBx"><ion-icon name="school-outline"></ion-icon></div>
                        </div>
                        <div class="card">
                            <div>
                                <div class="numbers" id="stat-contacts">${stats.contacts}</div>
                                <div class="cardName">Messages</div>
                            </div>
                            <div class="iconBx"><ion-icon name="chatbubbles-outline"></ion-icon></div>
                        </div>
                        <div class="card">
                            <div>
                                <div class="numbers">7,842</div>
                                <div class="cardName">Earnings</div>
                            </div>
                            <div class="iconBx"><ion-icon name="cash-outline"></ion-icon></div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const loadMessages = async () => {
        try {
            const response = await fetch('/api/admin/contacts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const contacts = await response.json();
                const tbody = document.querySelector('.recentOrders table tbody');
                if (tbody) {
                    tbody.innerHTML = '';
                    contacts.reverse().slice(0, 10).forEach(contact => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${contact.firstName} ${contact.lastName}</td>
                            <td>${contact.email}</td>
                            <td>${new Date(contact.date).toLocaleDateString()}</td>
                            <td><span class="status delivered">Message</span></td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    updateStats();
    loadMessages();

    // Toggle menu
    let toggle = document.querySelector('.toggle');
    let navigation = document.querySelector('.navigation');
    let main = document.querySelector('.main');

    if (toggle) {
        toggle.onclick = function() {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        }
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
