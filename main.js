//changing navbar style when scrolling
window.addEventListener('scroll',()=>{
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll',window.scrollY>0);
    }
});

//show/hide faq answer
const faqs=document.querySelectorAll('.faq');
faqs.forEach(faq=>{
    // Keyboard accessibility for FAQ
    faq.setAttribute('tabindex', '0');

    const toggleFAQ = () => {
        faq.classList.toggle('open');
        const icon=faq.querySelector('.faq_icon i');
        if(icon){
            if(icon.className==='uil uil-plus'){
                icon.className='uil uil-minus';
            }
            else{
                icon.className='uil uil-plus';
            }
        }
    };

    faq.addEventListener('click', toggleFAQ);

    faq.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFAQ();
        }
    });
});


//show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && menu && closeBtn) {
    menuBtn.addEventListener('click', ()=>{
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    })

    //close nav menu
    const closeNav = () => {
        menu.style.display="none";
        closeBtn.style.display = "none";
        menuBtn.style.display ="inline-block";
    }

    closeBtn.addEventListener('click',closeNav)
}

// Fetch and render courses
const fetchCourses = async () => {
    const courseContainer = document.querySelector('.courses__container');
    if (!courseContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        // If we are on the index page, only show popular courses (first 3)
        // If we are on courses page, show all.
        // For simplicity, if the container exists, we populate it.

        const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const displayCourses = isIndexPage ? courses.slice(0, 3) : courses;

        if (displayCourses.length > 0) {
            courseContainer.innerHTML = '';
            displayCourses.forEach(course => {
                const article = document.createElement('article');
                article.className = 'course';
                article.innerHTML = `
                    <div class="course__image">
                        <img src="${course.image}" alt="${course.title}">
                    </div>
                    <div class="course__info">
                        <h4>${course.title}</h4>
                        <p>${course.description}</p>
                        <a href="contact.html" class="btn btn-primary">Learn More</a>
                    </div>
                `;
                courseContainer.appendChild(article);
            });
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

document.addEventListener('DOMContentLoaded', fetchCourses);

// Authentication UI Logic
const updateAuthUI = () => {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
};

document.addEventListener('DOMContentLoaded', updateAuthUI);
