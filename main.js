// Centralized authentication UI update
const updateAuthUI = () => {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authLink.innerHTML = '';
        const a = document.createElement('a');
        a.href = '#';
        a.id = 'logout-btn';
        a.textContent = `${user.name} (Logout)`;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        });
        authLink.appendChild(a);
    } else {
        authLink.innerHTML = '';
        const a = document.createElement('a');
        a.href = 'login.html';
        a.textContent = 'Login';
        authLink.appendChild(a);
    }
};

// Record page view
const recordPageView = async () => {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (error) {
        console.error('Error recording page view:', error);
    }
};

// Dynamic course rendering
const renderCourses = async () => {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        // If we are on the homepage, only show first 3
        const isHomepage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const displayCourses = isHomepage ? courses.slice(0, 3) : courses;

        if (displayCourses.length > 0) {
            coursesContainer.innerHTML = '';
            displayCourses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imgDiv = document.createElement('div');
                imgDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image;
                img.alt = course.title;
                imgDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'course__info';

                const h4 = document.createElement('h4');
                h4.textContent = course.title;

                const p = document.createElement('p');
                p.textContent = course.description;

                const a = document.createElement('a');
                a.href = 'contact.html';
                a.className = 'btn btn-primary';
                a.textContent = 'Learn More';

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);
                infoDiv.appendChild(a);

                article.appendChild(imgDiv);
                article.appendChild(infoDiv);
                coursesContainer.appendChild(article);
            });
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    renderCourses();

    // Original navbar scroll effect
    window.addEventListener('scroll', () => {
        document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
    }, { passive: true });

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
    });

    // Show/hide nav menu
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
});

// Contact form handling (if on contact page)
if (window.location.pathname.endsWith('contact.html')) {
    const contactForm = document.querySelector('.contact__form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = {
                name: `${formData.get('firstName')} ${formData.get('lastName')}`,
                email: formData.get('email'),
                message: formData.get('message')
            };

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
            } catch (error) {
                console.error('Error submitting contact form:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }
}
