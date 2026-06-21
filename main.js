// Changing navbar style when scrolling
const nav = document.querySelector('nav');
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

window.addEventListener('scroll', throttle(() => {
    nav.classList.toggle('window-scroll', window.scrollY > 0);
}, 100), { passive: true });

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
    // Accessibility: Keyboard support
    faq.setAttribute('tabindex', '0');
    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            faq.click();
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
    })

    const closeNav = () => {
        menu.style.display = "none";
        closeBtn.style.display = "none";
        menuBtn.style.display = "inline-block";
    }

    closeBtn.addEventListener('click', closeNav);
}

// Centralized Auth UI Logic
const updateAuthUI = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
            });
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
}

// Dynamic Course Rendering
const fetchCourses = async () => {
    const courseContainer = document.querySelector('.courses__container');
    if (!courseContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        courseContainer.innerHTML = '';
        courses.forEach(course => {
            const article = document.createElement('article');
            article.className = 'course';
            article.innerHTML = `
                <div class="course__image">
                    <img src="${course.image}" alt="${course.title}" loading="lazy">
                </div>
                <div class="course__info">
                    <h4>${course.title}</h4>
                    <p>${course.description || 'Discover this amazing course on Tutorify.'}</p>
                    <a href="contact.html" class="btn btn-primary">Learn More</a>
                </div>
            `;
            courseContainer.appendChild(article);
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

// Contact Form Handling
const handleContactForm = () => {
    const contactForm = document.querySelector('.contact__form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        const submitBtn = contactForm.querySelector('button');
        const originalBtnText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Thank you! Your message has been sent.');
                contactForm.reset();
            } else {
                alert('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Contact error:', error);
            alert('An error occurred. Please try again later.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchCourses();
    handleContactForm();
});
