// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
});

// FAQ toggle
const faqs = document.querySelectorAll('.faq');
faqs.forEach(faq => {
    faq.addEventListener('click', () => {
        faq.classList.toggle('open');
        const icon = faq.querySelector('.faq_icon i');
        if (icon) {
            icon.className = icon.className === 'uil uil-plus' ? 'uil uil-minus' : 'uil uil-plus';
        }
    });
});

// Nav menu toggle
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && menu && closeBtn) {
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

// Update authentication link in Navbar
function updateAuthUI() {
    const navMenu = document.querySelector('.nav__menu');
    if (!navMenu) return;

    const user = JSON.parse(localStorage.getItem('user'));
    let authLink = document.getElementById('auth-link');

    if (!authLink) {
        const li = document.createElement('li');
        authLink = document.createElement('a');
        authLink.id = 'auth-link';
        li.appendChild(authLink);
        navMenu.appendChild(li);
    }

    if (user) {
        authLink.textContent = `Logout (${user.name})`;
        authLink.href = '#';
        authLink.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        };
    } else {
        authLink.textContent = 'Login';
        authLink.href = 'login.html';
        authLink.onclick = null;
    }
}

// Record Page View
async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        console.error('Failed to record page view:', err);
    }
}

// Contact Form Handler
function setupContactForm() {
    const contactForm = document.querySelector('.contact__form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'Send Message';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }

        const formData = new FormData(contactForm);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            message: formData.get('message')
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                alert('Thank you! Your message has been sent successfully.');
                contactForm.reset();
            } else {
                alert(result.message || 'Failed to send message.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred. Please try again later.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    });
}

// Dynamic Course Loader for courses.html
async function loadCourses() {
    const coursesContainer = document.querySelector('.courses__container');
    if (!coursesContainer) return;

    try {
        const response = await fetch('/api/courses');
        if (!response.ok) return;
        const courses = await response.json();

        if (courses && courses.length > 0) {
            coursesContainer.innerHTML = '';
            courses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';

                const imageDiv = document.createElement('div');
                imageDiv.className = 'course__image';
                const img = document.createElement('img');
                img.src = course.image || './images/digitalmarketing.png';
                img.alt = course.title;
                imageDiv.appendChild(img);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'course__info';

                const h4 = document.createElement('h4');
                h4.textContent = course.title;

                const p = document.createElement('p');
                p.textContent = course.description;

                const a = document.createElement('a');
                a.href = '#';
                a.className = 'btn btn-primary';
                a.textContent = 'Learn More';

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);
                infoDiv.appendChild(a);

                article.appendChild(imageDiv);
                article.appendChild(infoDiv);

                coursesContainer.appendChild(article);
            });
        }
    } catch (err) {
        console.error('Failed to load dynamic courses:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    recordPageView();
    setupContactForm();
    loadCourses();
});
