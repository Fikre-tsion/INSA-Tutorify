//changing navbar style when scrolling
window.addEventListener('scroll',()=>{
    document.querySelector('nav').classList.toggle('window-scroll',window.scrollY>0);
});




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

// Handle Contact Form Submission
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('contact-status');
        statusEl.textContent = 'Sending message...';
        statusEl.style.color = '#fff';

        const formData = {
            firstName: contactForm.firstName.value,
            lastName: contactForm.lastName.value,
            email: contactForm.email.value,
            message: contactForm.message.value
        };

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                statusEl.textContent = 'Thank you! Your message has been sent successfully.';
                statusEl.style.color = '#00f7ff';
                contactForm.reset();
            } else {
                statusEl.textContent = data.message || 'Failed to send message. Please try again.';
                statusEl.style.color = '#ff4d4d';
            }
        } catch (err) {
            statusEl.textContent = 'Network error. Please try again later.';
            statusEl.style.color = '#ff4d4d';
        }
    });
}