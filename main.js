// Performance Optimization: Lazy-cache `nav` element reference to avoid DOM query on every scroll tick.
// Use `{ passive: true }` so the browser knows the listener won't call `preventDefault()`, preventing scroll jank.
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