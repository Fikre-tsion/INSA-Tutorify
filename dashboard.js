async function updateStats() {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();

    document.getElementById('stat-users').textContent = stats.users || 0;
    document.getElementById('stat-courses').textContent = stats.courses || 0;
    document.getElementById('stat-contacts').textContent = stats.contacts || 0;
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

document.addEventListener('DOMContentLoaded', updateStats);
