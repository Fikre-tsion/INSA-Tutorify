// Performance Optimization (Bolt):
// 1. Lazy-cache `<nav>` element reference on first scroll event to prevent DOM querying on every scroll frame.
// 2. Add `{ passive: true }` to allow the browser to perform smooth scrolling without waiting for event listener completion.
let navElement = null;
window.addEventListener('scroll', () => {
    if (!navElement) {
        navElement = document.querySelector('nav');
    }
    if (navElement) {
        navElement.classList.toggle('window-scroll', window.scrollY > 0);
    }
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