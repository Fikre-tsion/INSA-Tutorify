async function loadTeacherCourses() {
    try {
        const courses = await api.fetch('/api/courses/teacher');
        const tableBody = document.getElementById('teacher-courses-table');
        if (!tableBody) return;

        tableBody.innerHTML = courses.map(course => `
            <tr class="course-row">
                <td class="ps-4">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${course.image}" class="rounded shadow-sm" style="width: 120px; height: 68px; object-fit: cover;">
                        <div>
                            <div class="fw-bold text-white mb-1">${course.title}</div>
                            <div class="text-muted small">${course.category}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${course.visibility === 'public' ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${course.visibility === 'public' ? 'text-success' : 'text-muted'} border border-${course.visibility === 'public' ? 'success' : 'secondary'} border-opacity-25 px-2 py-1">
                        <i class="uil ${course.visibility === 'public' ? 'uil-eye' : 'uil-link'} me-1"></i> ${course.visibility || 'public'}
                    </span>
                </td>
                <td class="text-muted">${new Date(course.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="d-flex gap-3 text-muted small">
                        <span><i class="uil uil-heart me-1 text-danger"></i> ${course.likes || 0}</span>
                        <span><i class="uil uil-star me-1 text-warning"></i> ${course.rating || 0}</span>
                    </div>
                </td>
                <td class="pe-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-light border-0" onclick="editCourse(${course.id})"><i class="uil uil-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteCourse(${course.id})"><i class="uil uil-trash-alt"></i></button>
                    </div>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center py-5 text-muted">No courses yet. Click "Create New" to start your journey!</td></tr>';
    } catch (error) {
        console.error('Failed to load teacher courses:', error);
    }
}

async function deleteCourse(id) {
    if (!confirm('Are you sure you want to delete this course? This action is permanent.')) return;
    try {
        await api.fetch(`/api/courses/${id}`, { method: 'DELETE' });
        loadTeacherCourses();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener('DOMContentLoaded', loadTeacherCourses);
