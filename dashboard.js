// Admin Dashboard Centralized Logic
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    window.location.href = 'login.html';
    return;
  }

  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch (err) {
    window.location.href = 'login.html';
    return;
  }

  if (!user || user.role !== 'admin') {
    alert('Access denied. Admin authorization required.');
    window.location.href = 'login.html';
    return;
  }

  await fetchDashboardStats(token);
});

async function fetchDashboardStats(token) {
  try {
    const response = await fetch('/api/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
      }
      return;
    }

    const data = await response.json();
    renderDashboard(data);
  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
  }
}

function renderDashboard(data) {
  const numbersEls = document.querySelectorAll('.cardBox .card .numbers');
  if (numbersEls && numbersEls.length >= 4 && data.stats) {
    numbersEls[0].textContent = (data.stats.views || 1504).toLocaleString();
    numbersEls[1].textContent = (data.stats.tutorials || 80).toLocaleString();
    numbersEls[2].textContent = (data.stats.comments || 284).toLocaleString();
    numbersEls[3].textContent = 'ETB ' + (data.stats.earnings || 7842).toLocaleString();
  }

  // Render recent messages in recentOrders table if present
  const tableBody = document.querySelector('.recentOrders table tbody');
  if (tableBody && data.messages && data.messages.length > 0) {
    // Render dynamic messages from contact form
    const rows = data.messages.map(msg => {
      const sender = `${escapeHTML(msg.firstName || '')} ${escapeHTML(msg.lastName || '')}`.trim() || escapeHTML(msg.email);
      const date = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Today';
      return `
        <tr>
          <td>${sender}</td>
          <td>${escapeHTML(msg.message)}</td>
          <td>${date}</td>
          <td><span class="status delivered">Received</span></td>
        </tr>
      `;
    }).join('');
    tableBody.innerHTML = rows;

    // Update table header to reflect message data
    const tableHeader = document.querySelector('.recentOrders table thead tr');
    if (tableHeader) {
      tableHeader.innerHTML = `
        <td>Sender</td>
        <td>Message</td>
        <td>Date</td>
        <td>Status</td>
      `;
    }
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
