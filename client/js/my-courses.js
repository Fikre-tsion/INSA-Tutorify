async function loadMyCourses() {
    try {
        const courses = await api.fetch('/api/courses/my-courses');
        const container = document.querySelector('.courses__container') || document.getElementById('my-courses-grid');
        if (!container) return;

        if (courses.length === 0) {
            const section = document.getElementById('my-courses-section');
            if (section) section.classList.add('hidden');
            container.innerHTML = '<p data-i18n="no_courses">You have not enrolled in any courses yet.</p>';
            return;
        }

        const section = document.getElementById('my-courses-section');
        if (section) section.classList.remove('hidden');

        container.innerHTML = '';
        for (const course of courses) {
            // Fetch progress for each course
            const progress = await api.fetch(`/api/courses/${course.id}/progress`);
            const completedCount = progress.completedLessons.length;
            const totalCount = course.lessons ? course.lessons.length : 3;
            const percentage = Math.round((completedCount / totalCount) * 100);
            const isCompleted = percentage === 100;

            const article = document.createElement('article');
            article.className = 'course';
            article.innerHTML = `
                <div class="course__image">
                    <img src="${course.image}" alt="${course.title}">
                </div>
                <div class="course__info">
                    <h4>${course.title}</h4>
                    <div class="progress-container" style="background:#eee; height:10px; border-radius:5px; margin:10px 0;">
                        <div class="progress-bar" style="background:var(--color-primary); height:100%; width:${percentage}%; border-radius:5px;"></div>
                    </div>
                    <small>${percentage}% Completed</small>
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <a href="course-player.html?id=${course.id}" class="btn btn-primary" data-i18n="go_to_course">Go to Course</a>
                        ${isCompleted ? `
                            <a href="certificate.html?courseId=${course.id}&courseTitle=${encodeURIComponent(course.title)}&studentName=${encodeURIComponent(JSON.parse(localStorage.getItem('user')).name)}"
                               target="_blank" class="btn" style="background:#4cd137; color:white;">Certificate</a>
                        ` : ''}
                    </div>
                </div>
            `;
            container.appendChild(article);
        }

        if (window.i18n) window.i18n.translatePage();
    } catch (error) {
        console.error('Failed to load my courses:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadMyCourses);
