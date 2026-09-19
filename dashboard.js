// Authentication check for Admin Dashboard
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
let user = null;

try {
  user = userStr ? JSON.parse(userStr) : null;
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

// Fetch dashboard statistics and data
async function fetchDashboardStats() {
  try {
    const response = await fetch('/api/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert('Session expired or unauthorized. Please log in again.');
        logout();
      }
      return;
    }

    const stats = await response.json();

    // Update Card Stats
    const cardNumbers = document.querySelectorAll('.card .numbers');
    if (cardNumbers.length >= 4) {
      cardNumbers[0].textContent = (stats.views || 0).toLocaleString();
      cardNumbers[1].textContent = (stats.coursesCount || 0).toLocaleString();
      cardNumbers[2].textContent = (stats.messagesCount || 0).toLocaleString();
      cardNumbers[3].textContent = (stats.usersCount || 0).toLocaleString();
    }

    // Update Recent Messages / Contact Submissions
    const recentOrdersTable = document.querySelector('.recentOrders table tbody');
    if (recentOrdersTable && Array.isArray(stats.messages) && stats.messages.length > 0) {
      recentOrdersTable.innerHTML = '';
      stats.messages.slice(-10).reverse().forEach(msg => {
        const tr = document.createElement('tr');

        const tdSender = document.createElement('td');
        const senderName = `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.email;
        tdSender.textContent = senderName;

        const tdMessage = document.createElement('td');
        tdMessage.textContent = msg.message && msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : (msg.message || '');

        const tdDate = document.createElement('td');
        tdDate.textContent = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'N/A';

        const tdStatus = document.createElement('td');
        const spanStatus = document.createElement('span');
        spanStatus.className = 'status delivered';
        spanStatus.textContent = 'Received';
        tdStatus.appendChild(spanStatus);

        tr.appendChild(tdSender);
        tr.appendChild(tdMessage);
        tr.appendChild(tdDate);
        tr.appendChild(tdStatus);

        recentOrdersTable.appendChild(tr);
      });
    }

    // Update Recent Registered Users
    const recentCustomersTable = document.querySelector('.recentCustomers table');
    if (recentCustomersTable && Array.isArray(stats.users) && stats.users.length > 0) {
      recentCustomersTable.innerHTML = '';
      stats.users.slice(-5).reverse().forEach(usr => {
        const tr = document.createElement('tr');

        const tdImg = document.createElement('td');
        tdImg.style.width = '60px';
        const imgBx = document.createElement('div');
        imgBx.className = 'imgBx';
        const img = document.createElement('img');
        img.src = './digitalmarketing.png';
        img.alt = usr.name;
        imgBx.appendChild(img);
        tdImg.appendChild(imgBx);

        const tdInfo = document.createElement('td');
        const h4 = document.createElement('h4');
        h4.textContent = usr.name;
        const br = document.createElement('br');
        const span = document.createElement('span');
        span.textContent = usr.role === 'admin' ? 'Administrator' : usr.email;
        span.title = usr.email;
        h4.appendChild(br);
        h4.appendChild(span);
        tdInfo.appendChild(h4);

        tr.appendChild(tdImg);
        tr.appendChild(tdInfo);

        recentCustomersTable.appendChild(tr);
      });
    }

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardStats();

  // Sidebar navigation toggle
  const toggle = document.querySelector('.toggle');
  const navigation = document.querySelector('.navigation');
  const main = document.querySelector('.main');

  if (toggle && navigation && main) {
    toggle.onclick = function() {
      navigation.classList.toggle('active');
      main.classList.toggle('active');
    };
  }

  document.querySelectorAll('.navigation ul li').forEach(li => {
    li.addEventListener('click', () => {
      document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
      li.classList.add('hovered');
    });
  });
});
