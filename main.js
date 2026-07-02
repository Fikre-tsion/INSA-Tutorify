//changing navbar style when scrolling
window.addEventListener('scroll',()=>{
    document.querySelector('nav').classList.toggle('window-scroll',window.scrollY>0);
}, { passive: true });




//show/hide faq answer
const faqs=document.querySelectorAll('.faq');
faqs.forEach(faq=>{
    faq.addEventListener('click',()=>{
        faq.classList.toggle('open');

//changing icon on faq click
        const icon=faq.querySelector('.faq_icon i');
        if(icon.className==='uil uil-plus'){
            icon.className='uil uil-minus';
        }
        else{
            icon.className='uil uil-plus';
        }
    })
});


//show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn) {
    menuBtn.addEventListener('click', ()=>{
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    })
}

//close nav menu
const closeNav = () => {
    menu.style.display="none";
    closeBtn.style.display = "none";
    menuBtn.style.display ="inline-block";
}

if (closeBtn) {
    closeBtn.addEventListener('click',closeNav)
}

// --- DYNAMIC CONTENT & STATS ---

async function recordPageView() {
    try {
        await fetch('/api/stats/view', { method: 'POST' });
    } catch (err) {
        console.error('Failed to record page view', err);
    }
}

async function fetchCourses() {
    const courseContainer = document.querySelector('.courses__container');
    if (!courseContainer) return;

    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        // Clear container if we're on a page that should render all or limited
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const displayCourses = isHomePage ? courses.slice(0, 3) : courses;

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
                        <a href="courses.html" class="btn btn-primary">Learn More</a>
                    </div>
                `;
                courseContainer.appendChild(article);
            });
        }
    } catch (err) {
        console.error('Failed to fetch courses', err);
    }
}

// Initializations
recordPageView();
fetchCourses();
