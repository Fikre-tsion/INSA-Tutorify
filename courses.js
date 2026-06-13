document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Course Loading for Courses page
    const coursesFullContainer = document.querySelector('.courses__container');
    if (coursesFullContainer && window.location.pathname.includes('courses.html')) {
        fetch('/api/courses')
            .then(res => res.json())
            .then(courses => {
                coursesFullContainer.innerHTML = '';
                courses.forEach(course => {
                    const article = document.createElement('article');
                    article.className = 'course';
                    article.innerHTML = `
                        <div class="course__image">
                            <img src="${course.image}" alt="${course.title}" loading="lazy">
                        </div>
                        <div class="course__info">
                            <h4>${course.title}</h4>
                            <p>${course.description}</p>
                            <a href="contact.html" class="btn btn-primary">Learn More</a>
                        </div>
                    `;
                    coursesFullContainer.appendChild(article);
                });
            });
    }
});
