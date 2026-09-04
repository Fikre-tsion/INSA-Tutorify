//changing navbar style when scrolling
window.addEventListener('scroll',()=>{
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('window-scroll', window.scrollY > 0);
    }
});

//show/hide faq answer
const faqs=document.querySelectorAll('.faq');
faqs.forEach(faq=>{
    faq.addEventListener('click',()=>{
        faq.classList.toggle('open');

        //changing icon on faq click
        const icon=faq.querySelector('.faq_icon i');
        if (icon) {
            if(icon.className==='uil uil-plus'){
                icon.className='uil uil-minus';
            }
            else{
                icon.className='uil uil-plus';
            }
        }
    })
});

//show/hide nav menu
const menu = document.querySelector(".nav__menu");
const menuBtn = document.querySelector("#open-menu-btn");
const closeBtn = document.querySelector("#close-menu-btn");

if (menuBtn && closeBtn && menu) {
    menuBtn.addEventListener('click', ()=>{
        menu.style.display = "flex";
        closeBtn.style.display = "inline-block";
        menuBtn.style.display = "none";
    });

    const closeNav = () => {
        menu.style.display="none";
        closeBtn.style.display = "none";
        menuBtn.style.display ="inline-block";
    };

    closeBtn.addEventListener('click', closeNav);
}

// Fullstack Integration: Record page view & dynamic course loading
document.addEventListener('DOMContentLoaded', () => {
    // Record page view
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});

    // Dynamic course rendering on courses section if container exists
    const coursesContainer = document.querySelector('.courses__container');
    if (coursesContainer) {
        fetch('/api/courses')
            .then(res => res.json())
            .then(courses => {
                if (courses && courses.length > 0) {
                    coursesContainer.innerHTML = '';
                    courses.forEach(course => {
                        const article = document.createElement('article');
                        article.className = 'course';
                        article.innerHTML = `
                            <div class="course__image">
                                <img src="${course.image || './images/course1.jpg'}" alt="${course.title}">
                            </div>
                            <div class="course__info">
                                <h4>${course.title}</h4>
                                <p>${course.description}</p>
                                <a href="courses.html" class="btn btn-primary">Learn More</a>
                            </div>
                        `;
                        coursesContainer.appendChild(article);
                    });
                }
            })
            .catch(err => console.error('Error fetching courses:', err));
    }
});
