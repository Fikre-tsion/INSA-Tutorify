document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Null-safe authentication check
  if (!token || !user || (user && user.role !== 'admin')) {
    alert('Access denied. Please login as admin.');
    window.location.href = 'login.html';
    return;
  }

  // Load Admin Dashboard Data
  fetchDashboardData(token);

  // Setup sidebar navigation toggles
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

window.logout = function() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
};

function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

async function fetchDashboardData(token) {
  try {
    const res = await fetch('/api/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        alert('Session expired or unauthorized. Please log in again.');
        window.logout();
        return;
      }
      throw new Error('Failed to load dashboard data');
    }

    const data = await res.json();
    renderDashboard(data);
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

function renderDashboard(data) {
  const { stats, usersCount, recentMessages, recentUsers } = data;

  // Update card numbers
  const cardNumbers = document.querySelectorAll('.cardBox .card .numbers');
  if (cardNumbers.length >= 4) {
    cardNumbers[0].textContent = (stats.views || 0).toLocaleString();
    cardNumbers[1].textContent = (stats.tutorials || 80).toLocaleString();
    cardNumbers[2].textContent = (recentMessages ? recentMessages.length : 0).toLocaleString();
    cardNumbers[3].textContent = (usersCount || 0).toLocaleString();
  }

  // Render recent messages in recent orders table
  const recentOrdersTable = document.querySelector('.recentOrders table tbody');
  if (recentOrdersTable) {
    if (recentMessages && recentMessages.length > 0) {
      recentOrdersTable.innerHTML = recentMessages.map(msg => `
        <tr>
          <td>${escapeHTML(msg.senderName)}</td>
          <td>${escapeHTML(msg.message)}</td>
          <td>${escapeHTML(new Date(msg.createdAt).toLocaleDateString())}</td>
          <td><span class="status delivered">Received</span></td>
        </tr>
      `).join('');
    } else {
      recentOrdersTable.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;">No recent messages received</td>
        </tr>
      `;
    }
  }

  // Render recent users in recent customers section
  const recentCustomersTable = document.querySelector('.recentCustomers table');
  if (recentCustomersTable) {
    if (recentUsers && recentUsers.length > 0) {
      recentCustomersTable.innerHTML = recentUsers.map(u => `
        <tr>
          <td width="60px">
            <div class="imgBx"><img src="./digitalmarketing.png" alt="User Avatar" onerror="this.src='./digitalmarketing.png'"></div>
          </td>
          <td>
            <h4>${escapeHTML(u.name)}<br><span>${escapeHTML(u.email)} (${escapeHTML(u.role)})</span></h4>
          </td>
        </tr>
      `).join('');
    }
  }
}
