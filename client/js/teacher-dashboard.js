// Theme Toggle Logic
const teacherThemeToggle = document.querySelector('#theme-toggle');
const currentTeacherTheme = localStorage.getItem('theme') || 'light';

const applyTheme = (theme) => {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        if (teacherThemeToggle) teacherThemeToggle.innerHTML = '<ion-icon name="moon-outline"></ion-icon>';
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (teacherThemeToggle) teacherThemeToggle.innerHTML = '<ion-icon name="sunny-outline"></ion-icon>';
    }
}

applyTheme(currentTeacherTheme);

if (teacherThemeToggle) {
    teacherThemeToggle.addEventListener('click', () => {
        const theme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(theme);
        localStorage.setItem('theme', theme);
    });
}

// Sidebar toggle
let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');
if (toggle) {
    toggle.onclick = () => {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    }
}

// --- Data Management ---
async function fetchMyCourses() {
    try {
        const courses = await api.fetch('/api/courses/teacher');
        renderCourses(courses);
    } catch (e) { console.error(e); }
}

function renderCourses(courses) {
    const tbody = document.querySelector('#teacher-courses-table tbody');
    tbody.innerHTML = courses.map(c => `
        <tr>
            <td>${c.title}</td>
            <td>${c.category}</td>
            <td>${c.popularity}</td>
            <td>${new Date(c.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn" onclick="editCourse(${c.id})" style="padding: 2px 8px; font-size: 0.8rem;">Edit</button>
                <button class="btn" onclick="deleteCourse(${c.id})" style="padding: 2px 8px; font-size: 0.8rem; background: var(--color-danger);">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Modal logic
const modal = document.getElementById('courseModal');
function openModal(course = null) {
    modal.style.display = 'block';
    if (course) {
        document.getElementById('modalTitle').innerText = 'Edit Course';
        document.getElementById('courseId').value = course.id;
        document.getElementById('title').value = course.title;
        document.getElementById('category').value = course.category;
        document.getElementById('image').value = course.image;
        document.getElementById('description').value = course.description;
    } else {
        document.getElementById('modalTitle').innerText = 'Add New Course';
        document.getElementById('courseForm').reset();
        document.getElementById('courseId').value = '';
    }
}

function closeModal() {
    modal.style.display = 'none';
}

window.openModal = openModal;
window.closeModal = closeModal;

async function editCourse(id) {
    try {
        const courses = await api.fetch('/api/courses/teacher');
        const course = courses.find(c => c.id === id);
        if (course) openModal(course);
    } catch (e) { console.error(e); }
}
window.editCourse = editCourse;

async function deleteCourse(id) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
        await api.fetch(`/api/courses/${id}`, { method: 'DELETE' });
        fetchMyCourses();
    } catch (e) { alert(e.message); }
}
window.deleteCourse = deleteCourse;

document.getElementById('courseForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('courseId').value;
    const body = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        image: document.getElementById('image').value,
        description: document.getElementById('description').value
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/courses/${id}` : '/api/courses';
        await api.fetch(url, { method, body: JSON.stringify(body) });
        closeModal();
        fetchMyCourses();
    } catch (e) { alert(e.message); }
};

document.addEventListener('DOMContentLoaded', fetchMyCourses);
