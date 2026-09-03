// Navigation scrolling effect
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (nav) {
    nav.classList.toggle('window-scroll', window.scrollY > 0);
  }
}, { passive: true });

// Show/Hide FAQ answers
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
  faq.addEventListener('click', () => {
    faq.classList.toggle('open');
    const icon = faq.querySelector('.faq_icon i');
    if (icon) {
      if (icon.className === 'uil uil-plus') {
        icon.className = 'uil uil-minus';
      } else {
        icon.className = 'uil uil-plus';
      }
    }
  });
});

// Navigation Menu Toggle
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn && menu) {
  menuBtn.addEventListener('click', () => {
    menu.style.display = "flex";
    closeBtn.style.display = "inline-block";
    menuBtn.style.display = "none";
  });

  const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
  };

  closeBtn.addEventListener('click', closeNav);
}

// Auth UI Updates
function updateAuthUI() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const authLink = document.getElementById('auth-link');

  if (authLink) {
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        authLink.innerHTML = `<a href="#" id="logout-btn">${user.name || 'User'} (Logout)</a>`;
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
          });
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
  }
}

// Track Page View Stats
function recordPageView() {
  fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
}

// Render dynamic courses
async function loadCourses() {
  const coursesContainer = document.querySelector('.courses__container');
  if (!coursesContainer) return;

  try {
    const response = await fetch('/api/courses');
    if (!response.ok) return;

    const courses = await response.json();
    if (!Array.isArray(courses) || courses.length === 0) return;

    // Check if on index page (show 3 courses) or courses page (show all)
    const isHomepage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || !window.location.pathname.includes('.html');
    const displayCourses = isHomepage ? courses.slice(0, 3) : courses;

    coursesContainer.innerHTML = '';
    displayCourses.forEach(course => {
      const article = document.createElement('article');
      article.className = 'course';

      const imgDiv = document.createElement('div');
      imgDiv.className = 'course__image';
      const img = document.createElement('img');
      img.src = course.image || './images/digitalmarketing.png';
      img.alt = course.title;
      imgDiv.appendChild(img);

      const infoDiv = document.createElement('div');
      infoDiv.className = 'course__info';

      const h4 = document.createElement('h4');
      h4.textContent = course.title;

      const p = document.createElement('p');
      p.textContent = course.description;

      const btn = document.createElement('a');
      btn.href = 'courses.html';
      btn.className = 'btn btn-primary';
      btn.textContent = 'Learn More';

      infoDiv.appendChild(h4);
      infoDiv.appendChild(p);
      infoDiv.appendChild(btn);

      article.appendChild(imgDiv);
      article.appendChild(infoDiv);

      coursesContainer.appendChild(article);
    });
  } catch (err) {
    console.error('Failed to load courses from API:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  recordPageView();
  loadCourses();
});
