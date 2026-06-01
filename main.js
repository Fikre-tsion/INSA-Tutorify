//changing navbar style when scrolling
window.addEventListener('scroll',()=>{
    document.querySelector('nav').classList.toggle('window-scroll',window.scrollY>0);
});

// Auth display logic site-wide
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('auth-link');
    const navMenu = document.querySelector('.nav__menu');

    if (authLink) {
        if (token && user) {
            authLink.innerHTML = '';
            const a = document.createElement('a');
            a.href = '#';
            a.id = 'logout-btn';
            a.textContent = `${user.name} (Logout)`;
            authLink.appendChild(a);

            a.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        } else {
            authLink.innerHTML = '<a href="login.html">Login</a>';
        }
    } else if (navMenu) {
        const li = document.createElement('li');
        li.id = 'auth-link';
        if (token && user) {
            const a = document.createElement('a');
            a.href = '#';
            a.id = 'logout-btn';
            a.textContent = `${user.name} (Logout)`;
            li.appendChild(a);
            navMenu.appendChild(li);

            a.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        } else {
            li.innerHTML = '<a href="login.html">Login</a>';
            navMenu.appendChild(li);
        }
    }
});

//show/hide faq answer
const faqs=document.querySelectorAll('.faq');
faqs.forEach(faq=>{
    faq.addEventListener('click',()=>{
        faq.classList.toggle('open');

//changing icon on faq click
        const icon=faq.querySelector('.faq__icon i');
        if(icon && icon.className==='uil uil-plus'){
            icon.className='uil uil-minus';
        }
        else if(icon){
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
    if (menu) menu.style.display="none";
    if (closeBtn) closeBtn.style.display = "none";
    if (menuBtn) menuBtn.style.display ="inline-block";
}

if (closeBtn) {
    closeBtn.addEventListener('click',closeNav)
}
