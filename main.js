// Throttle function to limit the execution rate of a function
const throttle = (callback, delay) => {
    let lastTime = 0;
    return (...args) => {
        const now = new Date().getTime();
        if (now - lastTime >= delay) {
            callback(...args);
            lastTime = now;
        }
    };
};

// Changing navbar style when scrolling (optimized with throttle)
window.addEventListener('scroll', throttle(() => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0);
}, 100));




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

// Auth display logic for all pages
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // Check if we are on a page with a nav__menu
    const navMenu = document.querySelector('.nav__menu');
    if (navMenu) {
        let authLink = document.getElementById('auth-link');

        // If auth-link doesn't exist, create it (for pages other than index.html)
        if (!authLink) {
            authLink = document.createElement('li');
            authLink.id = 'auth-link';
            navMenu.appendChild(authLink);
        }

        if (token && user) {
            authLink.innerHTML = `<a href="#" id="logout-btn">${user.name} (Logout)</a>`;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        } else {
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}