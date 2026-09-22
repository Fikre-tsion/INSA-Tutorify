document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user || user.role !== 'admin') {
    alert('Access denied. Please login as admin.');
    window.location.href = 'login.html';
    return;
  }

  // Update profile image fallback if missing
  const profileImg = document.querySelector('.user img');
  if (profileImg) {
    profileImg.onerror = () => { profileImg.src = './digitalmarketing.png'; };
  }

  try {
    const res = await fetch('/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      renderDashboard(data);
    } else {
      console.error('Failed to load dashboard stats');
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
});

function renderDashboard(data) {
  const { stats, messages, usersCount } = data;

  // Update card numbers
  const cards = document.querySelectorAll('.cardBox .card .numbers');
  if (cards.length >= 4) {
    if (stats.profileViews !== undefined) cards[0].textContent = Number(stats.profileViews).toLocaleString();
    if (stats.tutorials !== undefined) cards[1].textContent = Number(stats.tutorials).toLocaleString();
    if (messages) cards[2].textContent = Number(messages.length).toLocaleString();
    if (usersCount !== undefined) cards[3].textContent = Number(usersCount).toLocaleString();
  }

  // Render recent messages in recent orders table
  const tbody = document.querySelector('.recentOrders table tbody');
  if (tbody && messages && messages.length > 0) {
    tbody.innerHTML = messages.slice(0, 7).map(msg => `
      <tr>
        <td>${escapeHTML(msg.sender)}</td>
        <td>${escapeHTML(msg.message)}</td>
        <td>${new Date(msg.date).toLocaleDateString()}</td>
        <td><span class="status delivered">Received</span></td>
      </tr>
    `).join('');
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
