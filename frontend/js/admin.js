// ==================== VERIFICACIÓN DE SESIÓN ====================
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.rol !== 'admin') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const nameEl = document.getElementById('adminName');
    if (nameEl) nameEl.textContent = currentUser.nombre || 'Administrador';
    loadData();
});

// ==================== ESTADO GLOBAL ====================
let students    = [];
let teachers    = [];
let subjects    = [];
let enrollments = [];
let activities  = [];

let currentStudentPage    = 1;
let currentProfessorPage  = 1;
let currentSubjectPage    = 1;
let currentEnrollmentPage = 1;
let perPage = 10;

let studentFilter    = '';
let professorFilter  = '';
let subjectFilter    = '';
let enrollmentFilter = '';

// ==================== UTILIDADES ====================

function showToast(title, icon = 'success') {
    Swal.fire({ title, icon, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
}

async function confirmDelete(message) {
    const result = await Swal.fire({
        title: '¿Estás seguro?', text: message, icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#8B0000',
        cancelButtonColor: '#aaa', confirmButtonText: 'Sí, eliminar'
    });
    return result.isConfirmed;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function logout() {
    try { await apiFetch('/auth/logout.php', { method: 'POST' }); } catch (e) {}
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ==================== CARGAR DATOS ====================

async function loadData() {
    try {
        const [studentsRes, teachersRes, subjectsRes, enrollmentsRes] = await Promise.all([
            apiFetch('/estudiantes/'),
            apiFetch('/profesores/'),
            apiFetch('/materias/'),
            apiFetch('/matriculas/')
        ]);

        if (!studentsRes.ok)    throw new Error(`Error cargando estudiantes: ${studentsRes.status}`);
        if (!teachersRes.ok)    throw new Error(`Error cargando profesores: ${teachersRes.status}`);
        if (!subjectsRes.ok)    throw new Error(`Error cargando materias: ${subjectsRes.status}`);
        if (!enrollmentsRes.ok) throw new Error(`Error cargando matrículas: ${enrollmentsRes.status}`);

        students    = await studentsRes.json();
        teachers    = await teachersRes.json();
        subjects    = await subjectsRes.json();
        enrollments = await enrollmentsRes.json();

        teachers.forEach(t => { if (!t.subjectIds) t.subjectIds = []; });

        setupSearch();
        refreshAllViews();
        renderActivities();
        addActivity('Datos cargados desde el servidor');

    } catch (error) {
        console.error('Error cargando datos:', error);
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar los datos: ' + error.message, icon: 'error', confirmButtonColor: '#8B0000' });
    }
}

// ==================== ACTIVIDAD RECIENTE ====================

function addActivity(action) {
    activities.unshift({ action, date: new Date().toLocaleString() });
    if (activities.length > 15) activities.pop();
    renderActivities();
}

function renderActivities() {
    const container = document.getElementById('activityList');
    if (!container) return;
    container.innerHTML = activities
        .map(a => `<div class="activity-item"><i class="fas fa-circle-dot"></i> ${a.action} — ${a.date}</div>`)
        .join('') || '<div class="activity-item">Sin actividad reciente</div>';
}

// ==================== ESTADÍSTICAS ====================

function updateStats() {
    document.getElementById('totalStudents').innerText    = students.length;
    document.getElementById('totalTeachers').innerText    = teachers.length;
    document.getElementById('totalSubjects').innerText    = subjects.length;
    document.getElementById('totalEnrollments').innerText = enrollments.length;
}

// ==================== PAGINACIÓN ====================

function renderPaginatedTable(data, page, containerId, paginationId, rowRenderer) {
    const start     = (page - 1) * perPage;
    const paginated = data.slice(start, start + perPage);
    const tbody     = document.getElementById(containerId);

    if (tbody) {
        tbody.innerHTML = paginated.length
            ? paginated.map(rowRenderer).join('')
            : `<tr class="empty-row"><td colspan="10">No hay registros</td></tr>`;
    }

    const totalPages    = Math.ceil(data.length / perPage);
    const paginationDiv = document.getElementById(paginationId);
    if (!paginationDiv) return;

    const entity = containerId.split('Table')[0];
    paginationDiv.innerHTML = `
        <div class="page-info">Mostrando ${start + 1} a ${Math.min(start + perPage, data.length)} de ${data.length}</div>
        <div>
            <select id="perPageSelect" class="per-page-select">
                <option value="10" ${perPage === 10 ? 'selected' : ''}>10</option>
                <option value="25" ${perPage === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${perPage === 50 ? 'selected' : ''}>50</option>
            </select> por página
        </div>
        <div>
            <button onclick="changePage('${entity}', ${page - 1})" ${page <= 1 ? 'disabled' : ''}>Anterior</button>
            Pág. ${page} de ${totalPages}
            <button onclick="changePage('${entity}', ${page + 1})" ${page >= totalPages ? 'disabled' : ''}>Siguiente</button>
        </div>
    `;
    document.getElementById('perPageSelect').onchange = e => { perPage = parseInt(e.target.value); refreshAllViews(); };
}

function changePage(entity, newPage) {
    if (entity === 'students')   currentStudentPage   = newPage;
    if (entity === 'professors') currentProfessorPage = newPage;
    if (entity === 'subjects')   currentSubjectPage   = newPage;
    refreshAllViews();
}

function refreshAllViews() {
    renderStudents();
    renderTeachers();
    renderSubjects();
    renderEnrollments();
    updateStats();
}

// ==================== ESTUDIANTES ====================

function renderStudents() {
    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(studentFilter) ||
        s.email.toLowerCase().includes(studentFilter) ||
        (s.identificacion || '').toLowerCase().includes(studentFilter)
    );
    renderPaginatedTable(filtered, currentStudentPage, 'studentsTable', 'studentPagination', s => `
        <tr>
            <td>${s.id}</td>
            <td>${escapeHtml(s.identificacion || '—')}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${s.grade}</td>
            <td>${escapeHtml(s.seccion || '—')}</td>
            <td>
                <button class="btn-edit"   onclick="editStudent(${s.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-danger" onclick="deleteStudent(${s.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `);
}

function openStudentModal() {
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('studentModal').style.display = 'flex';
}

function editStudent(id) {
    const s = students.find(s => s.id === id);
    if (!s) return;
    document.getElementById('studentId').value             = s.id;
    document.getElementById('studentIdentificacion').value = s.identificacion || '';
    document.getElementById('studentName').value           = s.name;
    document.getElementById('studentEmail').value          = s.email;
    document.getElementById('studentGrade').value          = s.grade;
    document.getElementById('studentSeccion').value        = s.seccion || '';
    document.getElementById('studentModal').style.display  = 'flex';
}

async function deleteStudent(id) {
    if (!await confirmDelete('El estudiante perderá sus matrículas')) return;
    try {
        const res = await apiFetch('/estudiantes/delete.php', { method: 'DELETE', body: JSON.stringify({ id }) });
        if (res.ok) {
            students    = students.filter(s => s.id !== id);
            enrollments = enrollments.filter(e => e.studentId !== id);
            if (currentStudentPage > 1 && students.length <= (currentStudentPage - 1) * perPage) currentStudentPage--;
            refreshAllViews();
            addActivity(`Eliminó estudiante ID ${id}`);
            showToast('Estudiante eliminado');
        } else {
            const error = await res.json();
            Swal.fire('Error', error.error || 'No se pudo eliminar', 'error');
        }
    } catch (error) { Swal.fire('Error', error.message, 'error'); }
}

document.getElementById('studentForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id      = document.getElementById('studentId').value;
    const student = {
        ...(id ? { id: parseInt(id) } : {}),
        name:           document.getElementById('studentName').value,
        email:          document.getElementById('studentEmail').value,
        identificacion: document.getElementById('studentIdentificacion').value.trim(),
        grade:          document.getElementById('studentGrade').value,
        seccion:        document.getElementById('studentSeccion').value.trim()
    };
    try {
        const res = await apiFetch('/estudiantes/', { method: id ? 'PUT' : 'POST', body: JSON.stringify(student) });
        if (res.ok) {
            const result = await res.json();
            if (id) {
                students[students.findIndex(s => s.id === parseInt(id))] = { ...student, id: parseInt(id) };
                showToast('Estudiante actualizado');
                addActivity(`Editó ${student.name}`);
            } else {
                students.push({ ...student, id: result.id });
                showToast('Estudiante creado');
                addActivity(`Agregó ${student.name}`);
            }
            refreshAllViews();
            closeModal('studentModal');
        } else {
            const error = await res.json();
            Swal.fire('Error', error.error || 'No se pudo guardar', 'error');
        }
    } catch (error) { Swal.fire('Error', error.message, 'error'); }
});

// ==================== PROFESORES ====================

function renderTeachers() {
    const filtered = teachers.filter(t =>
        t.name.toLowerCase().includes(professorFilter) ||
        t.email.toLowerCase().includes(professorFilter) ||
        t.specialty.toLowerCase().includes(professorFilter)
    );
    renderPaginatedTable(filtered, currentProfessorPage, 'professorsTable', 'professorPagination', t => {
        const teacherSubjects = subjects.filter(s => t.subjectIds?.includes(s.id)).map(s => s.name).join(', ') || 'Sin materias';
        return `
            <tr>
                <td>${t.id}</td>
                <td>${escapeHtml(t.name)}</td>
                <td>${escapeHtml(t.email)}</td>
                <td>${escapeHtml(t.specialty)}</td>
                <td><span class="badge">${teacherSubjects.substring(0, 40)}${teacherSubjects.length > 40 ? '…' : ''}</span></td>
                <td>
                    <button class="btn-edit"   onclick="editTeacher(${t.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger" onclick="deleteTeacher(${t.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function openProfessorModal() {
    document.getElementById('professorSubjects').innerHTML = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    document.getElementById('professorForm').reset();
    document.getElementById('professorId').value = '';
    document.getElementById('professorModal').style.display = 'flex';
}

function editTeacher(id) {
    const t = teachers.find(t => t.id === id);
    if (!t) return;
    document.getElementById('professorSubjects').innerHTML = subjects.map(s => `<option value="${s.id}" ${t.subjectIds?.includes(s.id) ? 'selected' : ''}>${s.name}</option>`).join('');
    document.getElementById('professorId').value             = t.id;
    document.getElementById('professorIdentificacion').value = t.identificacion || '';
    document.getElementById('professorName').value           = t.name;
    document.getElementById('professorEmail').value          = t.email;
    document.getElementById('professorSpecialty').value      = t.specialty;
    document.getElementById('professorModal').style.display  = 'flex';
}

async function deleteTeacher(id) {
    if (!await confirmDelete('Las materias quedarán sin profesor')) return;
    try {
        const res = await apiFetch('/profesores/delete.php', { method: 'DELETE', body: JSON.stringify({ id }) });
        if (res.ok) {
            teachers = teachers.filter(t => t.id !== id);
            subjects.forEach(s => { if (s.teacherId === id) s.teacherId = null; });
            if (currentProfessorPage > 1 && teachers.length <= (currentProfessorPage - 1) * perPage) currentProfessorPage--;
            refreshAllViews();
            addActivity(`Eliminó profesor ID ${id}`);
            showToast('Profesor eliminado');
        } else {
            const error = await res.json();
            Swal.fire('Error', error.error || 'No se pudo eliminar', 'error');
        }
    } catch (error) { Swal.fire('Error', error.message, 'error'); }
}

document.getElementById('professorForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id      = document.getElementById('professorId').value;
    const teacher = {
        ...(id ? { id: parseInt(id) } : {}),
        name:           document.getElementById('professorName').value,
        email:          document.getElementById('professorEmail').value,
        identificacion: document.getElementById('professorIdentificacion').value.trim(),
        specialty:      document.getElementById('professorSpecialty').value,
        subjectIds:     []
    };
    try {
        const res = await apiFetch('/profesores/', { method: id ? 'PUT' : 'POST', body: JSON.stringify(teacher) });
        if (res.ok) {
            const result = await res.json();
            if (id) {
                teachers[teachers.findIndex(t => t.id === parseInt(id))] = { ...teacher, id: parseInt(id) };
                showToast('Profesor actualizado');
                addActivity(`Editó ${teacher.name}`);
            } else {
                teachers.push({ ...teacher, id: result.id });
                showToast('Profesor creado');
                addActivity(`Agregó ${teacher.name}`);
            }
            refreshAllViews();
            closeModal('professorModal');
        } else {
            const error = await res.json();
            Swal.fire('Error', error.error || 'No se pudo guardar', 'error');
        }
    } catch (error) { Swal.fire('Error', error.message, 'error'); }
});

// ==================== MATERIAS ====================

function renderSubjects() {
    const filtered = subjects.filter(s =>
        s.code.toLowerCase().includes(subjectFilter) ||
        s.name.toLowerCase().includes(subjectFilter)
    );
    renderPaginatedTable(filtered, currentSubjectPage, 'subjectsTable', 'subjectPagination', s => {
        const teacher = teachers.find(t => t.id === s.teacherId);
        return `
            <tr>
                <td>${s.id}</td>
                <td>${s.code}</td>
                <td>${escapeHtml(s.name)}</td>
                <td>${s.credits}</td>
                <td>${teacher ? escapeHtml(teacher.name) : 'Sin asignar'}</td>
                <td>
                    <button class="btn-edit"   onclick="editSubject(${s.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger" onclick="deleteSubject(${s.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function openSubjectModal() {
    document.getElementById('subjectTeacher').innerHTML =
        '<option value="">-- Ninguno --</option>' + teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    document.getElementById('subjectForm').reset();
    document.getElementById('subjectId').value      = '';
    document.getElementById('subjectCredits').value = 3;
    document.getElementById('subjectModal').style.display = 'flex';
}

function editSubject(id) {
    const s = subjects.find(s => s.id === id);
    if (!s) return;
    document.getElementById('subjectTeacher').innerHTML =
        '<option value="">-- Ninguno --</option>' + teachers.map(t => `<option value="${t.id}" ${t.id === s.teacherId ? 'selected' : ''}>${t.name}</option>`).join('');
    document.getElementById('subjectId').value      = s.id;
    document.getElementById('subjectCode').value    = s.code;
    document.getElementById('subjectName').value    = s.name;
    document.getElementById('subjectCredits').value = s.credits;
    document.getElementById('subjectModal').style.display = 'flex';
}

async function deleteSubject(id) {
    if (!await confirmDelete('Se eliminarán las matrículas asociadas')) return;
    try {
        const res = await apiFetch('/materias/delete.php', { method: 'DELETE', body: JSON.stringify({ id }) });
        if (res.ok) {
            subjects    = subjects.filter(s => s.id !== id);
            enrollments = enrollments.filter(e => e.subjectId !== id);
            if (currentSubjectPage > 1 && subjects.length <= (currentSubjectPage - 1) * perPage) currentSubjectPage--;
            refreshAllViews();
            addActivity(`Eliminó materia ID ${id}`);
            showToast('Materia eliminada');
        } else {
            const error = await res.json();
            Swal.fire('Error', error.error || 'No se pudo eliminar', 'error');
        }
    } catch (error) { Swal.fire('Error', error.message, 'error'); }
}

document.getElementById('subjectForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id        = document.getElementById('subjectId').value;
    const teacherId = document.getElementById('subjectTeacher').value;
    const subject   = {
        ...(id ? { id: parseInt(id) } : {}),
        code:      document.getElementById('subjectCode').value,
        name:      document.getElementById('subjectName').value,
        credits:   parseInt(document.getElementById('subjectCredits').value),
        teacherId: teacherId ? parseInt(teacherId) : null
    };
    try {
        const res = await apiFetch('/materias/', { method: id ? 'PUT' : 'POST', body: JSON.stringify(subject) });
        if (res.ok) {
            const result = await res.json();
            if (id) {
                subjects[subjects.findIndex(s => s.id === parseInt(id))] = { ...subject, id: parseInt(id) };
                showToast('Materia actualizada');
                addActivity(`Editó ${subject.name}`);
            } else {
                subjects.push({ ...subject, id: result.id });
                showToast('Materia creada');
                addActivity(`Agregó ${subject.name}`);
            }
            refreshAllViews();
            closeModal('subjectModal');
        } else {
            const error = await res.json();
            Swal.fire('Error', error.error || 'No se pudo guardar', 'error');
        }
    } catch (error) { Swal.fire('Error', error.message, 'error'); }
});

// ==================== MATRÍCULAS ====================

function renderEnrollments() {
    const enrollmentData = enrollments.map((e, idx) => {
        const student = students.find(s => s.id === e.studentId);
        const subject = subjects.find(s => s.id === e.subjectId);
        const teacher = teachers.find(t => t.id === subject?.teacherId);
        return {
            id: e.id, originalIndex: idx,
            studentName:    student ? student.name  : 'N/A',
            studentGrade:   student ? student.grade : 'N/A',
            subjectName:    subject ? subject.name  : 'N/A',
            teacherName:    teacher ? teacher.name  : 'N/A',
            enrollmentDate: e.enrollmentDate || new Date().toLocaleDateString()
        };
    });

    const filtered   = enrollmentData.filter(e =>
        e.studentName.toLowerCase().includes(enrollmentFilter) ||
        e.subjectName.toLowerCase().includes(enrollmentFilter)
    );
    const start      = (currentEnrollmentPage - 1) * perPage;
    const paginated  = filtered.slice(start, start + perPage);
    const totalPages = Math.ceil(filtered.length / perPage);

    const tbody = document.getElementById('enrollmentsTable');
    if (tbody) {
        tbody.innerHTML = paginated.length
            ? paginated.map((e, i) => `
                <tr>
                    <td>${start + i + 1}</td>
                    <td><strong>${escapeHtml(e.studentName)}</strong><br><small class="badge">${e.studentGrade}</small></td>
                    <td>${escapeHtml(e.subjectName)}</td>
                    <td>${escapeHtml(e.teacherName)}</td>
                    <td>${e.enrollmentDate}</td>
                    <td><button class="btn-danger" onclick="deleteEnrollment(${e.id})"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('')
            : '<tr class="empty-row"><td colspan="6">No hay matrículas que coincidan</td></tr>';
    }

    const paginationDiv = document.getElementById('enrollmentPagination');
    if (paginationDiv) {
        paginationDiv.innerHTML = `
            <div class="page-info">Mostrando ${start + 1} a ${Math.min(start + perPage, filtered.length)} de ${filtered.length} matrículas</div>
            <div>
                <button onclick="changeEnrollmentPage(${currentEnrollmentPage - 1})" ${currentEnrollmentPage <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Anterior</button>
                Página ${currentEnrollmentPage} de ${totalPages || 1}
                <button onclick="changeEnrollmentPage(${currentEnrollmentPage + 1})" ${currentEnrollmentPage >= totalPages ? 'disabled' : ''}>Siguiente <i class="fas fa-chevron-right"></i></button>
            </div>
            <div>
                <select id="perPageSelectEnroll" class="per-page-select">
                    <option value="10" ${perPage === 10 ? 'selected' : ''}>10</option>
                    <option value="25" ${perPage === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${perPage === 50 ? 'selected' : ''}>50</option>
                </select> por página
            </div>
        `;
        document.getElementById('perPageSelectEnroll').onchange = e => {
            perPage = parseInt(e.target.value);
            currentEnrollmentPage = 1;
            renderEnrollments();
        };
    }
    updateEnrollmentSelects();
}

function changeEnrollmentPage(newPage) {
    if (newPage >= 1) { currentEnrollmentPage = newPage; renderEnrollments(); }
}

function updateEnrollmentSelects() {
    const studentSelect = document.getElementById('enrollmentStudent');
    const subjectSelect = document.getElementById('enrollmentSubject');
    if (studentSelect) studentSelect.innerHTML = '<option value="">-- Seleccionar Estudiante --</option>' + students.map(s => `<option value="${s.id}">${escapeHtml(s.name)} — ${s.grade}</option>`).join('');
    if (subjectSelect) subjectSelect.innerHTML = '<option value="">-- Seleccionar Materia --</option>' + subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (${s.code})</option>`).join('');
}

async function deleteEnrollment(id) {
    const enrollment = enrollments.find(e => e.id === id);
    const student    = students.find(s => s.id === enrollment?.studentId);
    const subject    = subjects.find(s => s.id === enrollment?.subjectId);

    const result = await Swal.fire({
        title: '¿Eliminar matrícula?',
        html: `Estás por eliminar la matrícula de <strong>${student?.name}</strong> en <strong>${subject?.name}</strong>`,
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#8B0000',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const res = await apiFetch('/matriculas/', { method: 'DELETE', body: JSON.stringify({ id }) });
            if (res.ok) {
                enrollments = enrollments.filter(e => e.id !== id);
                renderEnrollments();
                updateStats();
                addActivity(`Eliminó matrícula: ${student?.name} — ${subject?.name}`);
                showToast('Matrícula eliminada');
            } else {
                const error = await res.json();
                Swal.fire('Error', error.error || 'No se pudo eliminar', 'error');
            }
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    }
}

function openEnrollmentModal() {
    renderEnrollments();
    document.getElementById('enrollmentModal').style.display = 'flex';
}

document.getElementById('enrollmentForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const studentId = parseInt(document.getElementById('enrollmentStudent').value);
    const subjectId = parseInt(document.getElementById('enrollmentSubject').value);

    if (!studentId || !subjectId) { Swal.fire('Error', 'Selecciona un estudiante y una materia', 'error'); return; }
    if (enrollments.some(e => e.studentId === studentId && e.subjectId === subjectId)) {
        Swal.fire('Error', 'Este estudiante ya está matriculado en esta materia', 'error'); return;
    }

    const student = students.find(s => s.id === studentId);
    const subject = subjects.find(s => s.id === subjectId);

    try {
        const res = await apiFetch('/matriculas/', { method: 'POST', body: JSON.stringify({ studentId, subjectId }) });
        if (res.ok) {
            const result = await res.json();
            enrollments.push({ id: result.id, studentId, subjectId, enrollmentDate: new Date().toLocaleDateString() });
            renderEnrollments();
            updateStats();
            addActivity(`Asignó ${subject?.name} a ${student?.name}`);
            showToast(`Matrícula creada: ${student?.name} — ${subject?.name}`);
            closeModal('enrollmentModal');
            document.getElementById('enrollmentForm').reset();
        } else {
            const error = await res.json();
            Swal.fire('Error', error.error || 'No se pudo crear', 'error');
        }
    } catch (error) { Swal.fire('Error', error.message, 'error'); }
});

// ==================== BÚSQUEDA ====================

function setupSearch() {
    document.getElementById('searchStudent')?.addEventListener('input', e => { studentFilter = e.target.value.toLowerCase(); currentStudentPage = 1; renderStudents(); });
    document.getElementById('searchProfessor')?.addEventListener('input', e => { professorFilter = e.target.value.toLowerCase(); currentProfessorPage = 1; renderTeachers(); });
    document.getElementById('searchSubject')?.addEventListener('input', e => { subjectFilter = e.target.value.toLowerCase(); currentSubjectPage = 1; renderSubjects(); });
    document.getElementById('searchEnrollment')?.addEventListener('input', e => { enrollmentFilter = e.target.value.toLowerCase(); currentEnrollmentPage = 1; renderEnrollments(); });
}

// ==================== NAVEGACIÓN ====================

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const view = this.dataset.view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
        if (view === 'enrollments') renderEnrollments();
    });
});