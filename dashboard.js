document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user || (user && user.role !== 'admin')) {
    window.location.href = 'login.html';
    return;
  }

  // Fallback image handlers for avatars
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      img.src = './digitalmarketing.png';
    });
  });

  try {
    const response = await fetch('/api/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
      }
      return;
    }

    const data = await response.json();
    if (data.stats) {
      const numberEls = document.querySelectorAll('.cardBox .numbers');
      if (numberEls.length >= 4) {
        numberEls[0].textContent = (data.stats.views || 0).toLocaleString();
        numberEls[1].textContent = (data.stats.tutorials || 80).toLocaleString();
        numberEls[2].textContent = (data.stats.comments || 284).toLocaleString();
        numberEls[3].textContent = (data.stats.earnings || 7842).toLocaleString();
      }
    }
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
  }
});
