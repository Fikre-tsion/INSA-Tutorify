// Changing navbar style when scrolling
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('window-scroll', window.scrollY > 0);
});

// Show/hide faq answer
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon.className === 'uil uil-plus') {
            icon.className = 'uil uil-minus';
        } else {
            icon.className = 'uil uil-plus';
        }
    });
    // Accessibility: Keyboard support for FAQ
    faq.setAttribute('tabindex', '0');
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            faq.click();
        }
    });
});

// Nav menu toggle
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });
}

const closeNav = () => {
    menu.style.display = "none";
    closeBtn.style.display = "none";
    menuBtn.style.display = "inline-block";
};

if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
}

// Auth display and Course loading
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (token && user && authLink) {
        authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        });
    }

    // Dynamic Course Loading if container exists
    const coursesContainer = document.querySelector('.courses__container');
    if (coursesContainer) {
        fetch('/api/courses')
            .then(res => res.json())
            .then(courses => {
                if (courses.length > 0) {
                    // If it's the home page, maybe only show first 3
                    const limit = window.location.pathname.includes('courses.html') ? courses.length : 3;
                    coursesContainer.innerHTML = '';
                    courses.slice(0, limit).forEach(course => {
                        const article = document.createElement('article');
                        article.className = 'course';
                        article.innerHTML = `
                            <div class="course__image">
                                <img src="${course.image}" alt="${course.title}" loading="lazy">
                            </div>
                            <div class="course__info">
                                <h4>${course.title}</h4>
                                <p>${course.description}</p>
                                <a href="contact.html" class="btn btn-primary">Learn More</a>
                            </div>
                        `;
                        coursesContainer.appendChild(article);
                    });
                }
            });
    }

    // Dashboard Stats Loading
    const statsUsers = document.getElementById('stat-users');
    if (statsUsers) {
        fetch('/api/stats')
            .then(res => res.json())
            .then(stats => {
                document.getElementById('stat-users').textContent = stats.users;
                document.getElementById('stat-courses').textContent = stats.courses;
                document.getElementById('stat-contacts').textContent = stats.contacts;
            });
    }

    // Contact Form handling
    const contactForm = document.querySelector('.contact__form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            const submitBtn = contactForm.querySelector('button');
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    alert('Message sent successfully!');
                    contactForm.reset();
                } else {
                    alert('Failed to send message.');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});
