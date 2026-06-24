async function loadStats() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      logout();
      return;
    }

    const stats = await response.json();
    document.getElementById('stat-views').textContent = stats.views;
    document.getElementById('stat-courses').textContent = stats.courseCount;
    document.getElementById('stat-messages').textContent = stats.messageCount;
    document.getElementById('stat-users').textContent = stats.userCount;

    const msgList = document.getElementById('messages-list');
    msgList.innerHTML = stats.messages.map(m => `
      <tr><td>${m.name}</td><td>${m.email}</td><td>${new Date(m.date).toLocaleDateString()}</td></tr>
    `).join('');

    const userList = document.getElementById('users-list');
    userList.innerHTML = stats.users.map(u => `
      <tr><td><h4>${u.name}<br><span>${u.role}</span></h4></td></tr>
    `).join('');

    document.getElementById('loading').classList.add('hidden');
  } catch (err) {
    console.error('Failed to load stats', err);
    alert('Failed to connect to server');
  }
}

document.addEventListener('DOMContentLoaded', () => {
    loadStats();

    let toggle = document.querySelector('.toggle');
    let navigation = document.querySelector('.navigation');
    let main = document.querySelector('.main');
    if (toggle) {
        toggle.onclick = () => {
          navigation.classList.toggle('active');
          main.classList.toggle('active');
        };
    }
});
