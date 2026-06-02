// ==================== VARIABLES GLOBALES ====================
let currentTeacher        = null;
let mySubjects            = [];
let myEnrollments         = [];
let myGrades              = [];
let myComments            = [];
let myStudents            = [];

let currentSubjectId       = null;
let currentStudentForModal = null;
let currentTrimestre       = 'I Trimestre';

// ==================== NORMALIZACIÓN ====================
function normalizeGrade(g) {
    return {
        id:          g.id,
        studentId:   parseInt(g.estudiante_id),
        subjectId:   parseInt(g.materia_id),
        type:        g.tipo,
        score:       parseFloat(g.puntaje),
        trimestre:   g.trimestre,
        comment:     g.comentario || '',
        date:        g.fecha_registro ? g.fecha_registro.split(' ')[0] : new Date().toLocaleDateString(),
        studentName: g.estudiante_nombre,
        subjectName: g.materia_nombre
    };
}

function normalizeEnrollment(e) {
    return {
        id:           e.id,
        studentId:    parseInt(e.studentId),
        subjectId:    parseInt(e.subjectId),
        studentName:  e.studentName  || '',
        studentGrade: e.studentGrade || '',
        studentEmail: e.studentEmail || '',
        subjectName:  e.subjectName  || ''
    };
}

// ==================== CARGA DE DATOS ====================
async function loadData() {
    currentTeacher = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentTeacher || currentTeacher.rol !== 'profesor') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('teacherName').textContent = currentTeacher.nombre || 'Profesor';
    document.getElementById('welcomeName').textContent = currentTeacher.nombre || 'Profesor';

    try {
        const [subjectsRes, enrollmentsRes, gradesRes, commentsRes] = await Promise.all([
            apiFetch('/materias/'),
            apiFetch('/matriculas/'),
            apiFetch('/notas/'),
            apiFetch('/comentarios/')
        ]);

        if (!subjectsRes.ok)    throw new Error('Error cargando materias');
        if (!enrollmentsRes.ok) throw new Error('Error cargando matrículas');
        if (!gradesRes.ok)      throw new Error('Error cargando notas');
        if (!commentsRes.ok)    throw new Error('Error cargando comentarios');

        const subjectsJson    = await subjectsRes.json();
        const enrollmentsJson = await enrollmentsRes.json();
        const gradesJson      = await gradesRes.json();
        const commentsJson    = await commentsRes.json();

        const allSubjects    = subjectsJson.data    ?? subjectsJson;
        const allEnrollments = enrollmentsJson.data ?? enrollmentsJson;
        const allGrades      = gradesJson.data      ?? gradesJson;
        myComments           = commentsJson.data    ?? commentsJson;

        // El servidor ya filtra matrículas y notas por profesor.
        // Materias: filtrar client-side las propias.
        mySubjects    = allSubjects.filter(s => parseInt(s.teacherId) === currentTeacher.id_referencia);
        myEnrollments = allEnrollments.map(normalizeEnrollment);
        myGrades      = allGrades.map(normalizeGrade);

        // Construir mapa de estudiantes únicos desde las matrículas
        const studentMap = {};
        myEnrollments.forEach(e => {
            if (!studentMap[e.studentId]) {
                studentMap[e.studentId] = {
                    id:    e.studentId,
                    name:  e.studentName,
                    grade: e.studentGrade,
                    email: e.studentEmail
                };
            }
        });
        myStudents = Object.values(studentMap);

        updateDashboard();
        renderSubjects();
        renderComments();
        loadSubjectSelect();

    } catch (error) {
        console.error('Error cargando datos:', error);
        Swal.fire('Error', 'No se pudieron cargar los datos: ' + error.message, 'error');
    }
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    const uniqueStudentIds = [...new Set(myEnrollments.map(e => e.studentId))];
    document.getElementById('mySubjectsCount').textContent = mySubjects.length;
    document.getElementById('myStudentsCount').textContent = uniqueStudentIds.length;
    document.getElementById('myGradesCount').textContent   = myGrades.length;
}

// ==================== FILTRADO ====================
function getStudentsForSubject(subjectId) {
    const studentIds = myEnrollments
        .filter(e => e.subjectId === subjectId)
        .map(e => e.studentId);
    return myStudents.filter(s => studentIds.includes(s.id));
}

function getGradesForStudent(studentId, subjectId = null, trimestre = null) {
    let grades = myGrades.filter(g => g.studentId === studentId);
    if (subjectId) grades = grades.filter(g => g.subjectId === subjectId);
    if (trimestre && trimestre !== 'Todas') grades = grades.filter(g => g.trimestre === trimestre);
    return grades.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getAverageForStudentTrimestre(studentId, subjectId, trimestre) {
    let grades = myGrades.filter(g => g.studentId === studentId && g.subjectId === subjectId);
    if (trimestre && trimestre !== 'Todas') grades = grades.filter(g => g.trimestre === trimestre);
    if (grades.length === 0) return null;
    const sum = grades.reduce((acc, g) => acc + g.score, 0);
    return (sum / grades.length).toFixed(1);
}

// ==================== MATERIAS ====================
function renderSubjects() {
    const container = document.getElementById('subjectsList');
    if (mySubjects.length === 0) {
        container.innerHTML = '<div class="card" style="text-align:center; padding:40px;"><i class="fas fa-info-circle"></i> Aún no tienes materias asignadas</div>';
        return;
    }
    container.innerHTML = mySubjects.map(s => {
        const students = getStudentsForSubject(s.id);
        return `
            <div class="subject-card" onclick="selectSubjectForGrades(${s.id})">
                <h4><i class="fas fa-book"></i> ${escapeHtml(s.name)}</h4>
                <p><i class="fas fa-code"></i> Código: ${s.code}</p>
                <p><i class="fas fa-star"></i> Créditos: ${s.credits}</p>
                <p><i class="fas fa-users"></i> Estudiantes: ${students.length}</p>
            </div>
        `;
    }).join('');
}

function loadSubjectSelect() {
    const select = document.getElementById('gradeSubject');
    select.innerHTML = '<option value="">-- Seleccionar una materia --</option>' +
        mySubjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (${s.code})</option>`).join('');
}

function selectSubjectForGrades(subjectId) {
    currentSubjectId = subjectId;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-view="grades"]').classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('gradesView').classList.add('active');
    document.getElementById('gradeSubject').value = subjectId;
    changeSubject();
}

// ==================== GESTIÓN DE NOTAS ====================
function changeSubject() {
    const val = document.getElementById('gradeSubject').value;
    currentSubjectId = val ? parseInt(val) : null;
    if (currentSubjectId) {
        renderStudentsByGrade();
        updateQuickStats();
        document.getElementById('quickStats').style.display = 'flex';
    } else {
        document.getElementById('studentsByGrade').innerHTML = '<div class="card" style="text-align:center; padding:40px;"><i class="fas fa-hand-point-left"></i> Selecciona una materia para ver los estudiantes</div>';
        document.getElementById('quickStats').style.display = 'none';
    }
}

function updateQuickStats() {
    const students = getStudentsForSubject(currentSubjectId);
    let totalGrades = 0, approved = 0, failed = 0, withGrades = 0;

    students.forEach(s => {
        const avg = getAverageForStudentTrimestre(s.id, currentSubjectId, null);
        if (avg !== null) {
            totalGrades += parseFloat(avg);
            withGrades++;
            parseFloat(avg) >= 3 ? approved++ : failed++;
        }
    });

    document.getElementById('statTotalStudents').textContent = students.length;
    document.getElementById('statAvgGrade').textContent      = withGrades > 0 ? (totalGrades / withGrades).toFixed(1) : 0;
    document.getElementById('statApproved').textContent      = approved;
    document.getElementById('statFailed').textContent        = failed;
}

function renderStudentsByGrade() {
    const students    = getStudentsForSubject(currentSubjectId);
    const container   = document.getElementById('studentsByGrade');
    const gradesOrder = ['9°', '10°', '11°', '12°'];
    const grouped     = {};

    if (students.length === 0) {
        container.innerHTML = '<div class="card" style="text-align:center; padding:40px;"><i class="fas fa-user-graduate"></i> No hay estudiantes matriculados en esta materia</div>';
        return;
    }

    students.sort((a, b) => a.name.localeCompare(b.name));
    students.forEach(s => {
        const g = s.grade || 'Sin grado';
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(s);
    });

    const sortedGrades = Object.keys(grouped).sort((a, b) => {
        const ia = gradesOrder.indexOf(a), ib = gradesOrder.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1; if (ib === -1) return -1;
        return ia - ib;
    });

    container.innerHTML = sortedGrades.map(grade => `
        <div class="grade-section">
            <div class="grade-header" onclick="toggleGradeSection(this)">
                <span><i class="fas fa-graduation-cap"></i> Grado ${grade} (${grouped[grade].length} estudiantes)</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="grade-students">
                ${grouped[grade].map(s => renderStudentCard(s)).join('')}
            </div>
        </div>
    `).join('');
}

function renderStudentCard(student) {
    const avg = getAverageForStudentTrimestre(student.id, currentSubjectId, null);
    return `
        <div class="student-grade-card" onclick="openStudentGradesModal(${student.id})">
            <div class="student-info">
                <div class="student-name"><i class="fas fa-user"></i> ${escapeHtml(student.name)}</div>
                <div class="student-email"><i class="fas fa-envelope"></i> ${escapeHtml(student.email || '')}</div>
            </div>
            <div class="grades-info">
                ${avg !== null ? `
                    <div class="current-grade">
                        <i class="fas fa-chart-line"></i> Promedio General: <strong>${avg}</strong>
                        <span class="${parseFloat(avg) >= 3 ? 'grade-badge' : 'grade-badge low'}" style="margin-left:8px;">
                            ${parseFloat(avg) >= 3 ? '<i class="fas fa-check"></i> Aprobado' : '<i class="fas fa-rotate"></i> En proceso'}
                        </span>
                    </div>
                ` : '<div class="current-grade"><i class="fas fa-info-circle"></i> Sin notas registradas</div>'}
                <div style="font-size:12px; color:#8a7055; margin-top:6px;"><i class="fas fa-mouse-pointer"></i> Click para ver detalle</div>
            </div>
        </div>
    `;
}

function toggleGradeSection(element) {
    element.classList.toggle('collapsed');
    element.nextElementSibling.classList.toggle('collapsed');
}

// ==================== MODAL DE NOTAS ====================
function openStudentGradesModal(studentId) {
    currentStudentForModal = myStudents.find(s => s.id === studentId);
    if (!currentStudentForModal) return;
    renderStudentModal();
    document.getElementById('studentGradesModal').style.display = 'flex';
}

function closeStudentModal() {
    document.getElementById('studentGradesModal').style.display = 'none';
}

function renderStudentModal() {
    const container = document.getElementById('studentModalContent');
    const subject   = mySubjects.find(s => s.id === currentSubjectId);

    container.innerHTML = `
        <div class="student-header">
            <div class="student-avatar"><i class="fas fa-user-graduate"></i></div>
            <div class="student-details">
                <h3>${escapeHtml(currentStudentForModal.name)}</h3>
                <p><i class="fas fa-envelope"></i> ${escapeHtml(currentStudentForModal.email || '')} | <i class="fas fa-graduation-cap"></i> Grado ${currentStudentForModal.grade}</p>
                <p><i class="fas fa-book"></i> ${escapeHtml(subject?.name || '')} (${subject?.code || ''})</p>
            </div>
        </div>
        <div class="trimestre-tabs">
            ${['I Trimestre', 'II Trimestre', 'III Trimestre', 'Todas'].map(t => `
                <button class="trimestre-tab ${currentTrimestre === t ? 'active' : ''}" onclick="changeTrimestre('${t}')">
                    <i class="fas fa-calendar-alt"></i> ${t}
                </button>
            `).join('')}
        </div>
        <div id="modalTrimestreContent"></div>
    `;

    renderTrimestreContent();
}

function renderTrimestreContent() {
    const container = document.getElementById('modalTrimestreContent');
    const grades    = getGradesForStudent(
        currentStudentForModal.id, currentSubjectId,
        currentTrimestre === 'Todas' ? null : currentTrimestre
    );
    const avg = currentTrimestre !== 'Todas'
        ? getAverageForStudentTrimestre(currentStudentForModal.id, currentSubjectId, currentTrimestre)
        : null;

    container.innerHTML = `
        ${avg !== null ? `
            <div class="period-avg">
                <i class="fas fa-chart-line"></i> Promedio de ${currentTrimestre}: <span>${avg}</span>
                ${parseFloat(avg) >= 3 ? '<i class="fas fa-trophy"></i> Aprobado' : '<i class="fas fa-rotate"></i> En proceso'}
            </div>
        ` : ''}

        <div class="add-grade-section">
            <div class="add-grade-title"><i class="fas fa-plus-circle"></i> Agregar nueva evaluación</div>
            <div class="grade-form-row">
                <div class="form-group">
                    <label>Tipo</label>
                    <select id="newGradeType" class="grade-type-select">
                        <option value="parcial">Parcial</option>
                        <option value="taller">Taller</option>
                        <option value="tarea">Tarea</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Nota (1.0 - 5.0)</label>
                    <input type="number" id="newGradeScore" step="0.1" min="1" max="5" placeholder="Ej: 4.5">
                </div>
                <div class="form-group" style="flex:2">
                    <label>Comentario</label>
                    <input type="text" id="newGradeComment" placeholder="Descripción de la evaluación...">
                </div>
                <div class="form-group">
                    <button class="btn-primary" onclick="addNewGrade()" style="margin-top:22px;">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                </div>
            </div>
        </div>

        <div class="grades-history">
            <div class="grades-history-title">
                <i class="fas fa-history"></i>
                ${currentTrimestre === 'Todas' ? 'Historial completo' : `Notas del ${currentTrimestre}`}
                (${grades.length} registros)
            </div>
            <div id="gradesHistoryList">
                ${grades.length === 0
                    ? '<div style="text-align:center; padding:40px; color:#8a7055;"><i class="fas fa-inbox"></i> No hay notas en este período</div>'
                    : grades.map(g => renderGradeHistoryItem(g)).join('')
                }
            </div>
        </div>
    `;
}

function renderGradeHistoryItem(grade) {
    const typeLabels = {
        parcial: '<i class="fas fa-pen"></i> Parcial',
        taller:  '<i class="fas fa-tools"></i> Taller',
        tarea:   '<i class="fas fa-house"></i> Tarea'
    };
    return `
        <div class="grade-history-item ${grade.type}">
            <div class="grade-info">
                <div>
                    <span class="grade-type-badge ${grade.type}">${typeLabels[grade.type] || grade.type}</span>
                    <span class="grade-score">${grade.score}</span>
                </div>
                ${grade.comment ? `<div class="grade-comment"><i class="fas fa-quote-left"></i> ${escapeHtml(grade.comment)}</div>` : ''}
                <div class="grade-date"><i class="fas fa-calendar-alt"></i> ${grade.date} | ${grade.trimestre}</div>
            </div>
            <div class="grade-actions">
                <button class="delete-grade-btn" onclick="deleteGrade(${grade.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
}

function changeTrimestre(trimestre) {
    currentTrimestre = trimestre;
    document.querySelectorAll('.trimestre-tab').forEach(tab => {
        const label = trimestre === 'Todas' ? 'Todas' : trimestre;
        tab.classList.toggle('active', tab.textContent.trim().includes(label));
    });
    renderTrimestreContent();
}

// ==================== AGREGAR NOTA ====================
async function addNewGrade() {
    const type      = document.getElementById('newGradeType').value;
    const score     = parseFloat(document.getElementById('newGradeScore').value);
    const comment   = document.getElementById('newGradeComment').value.trim();
    const trimestre = currentTrimestre === 'Todas' ? 'I Trimestre' : currentTrimestre;

    if (isNaN(score) || score < 1 || score > 5) {
        Swal.fire('Error', 'La nota debe ser un número entre 1.0 y 5.0', 'error');
        return;
    }

    try {
        const res = await apiFetch('/notas/', {
            method: 'POST',
            body: JSON.stringify({
                estudiante_id: currentStudentForModal.id,
                materia_id:    currentSubjectId,
                tipo:          type,
                puntaje:       score,
                trimestre:     trimestre,
                comentario:    comment || null
            })
        });

        if (res.ok) {
            const result  = await res.json();
            const subject = mySubjects.find(s => s.id === currentSubjectId);
            myGrades.push({
                id:          result.id,
                studentId:   currentStudentForModal.id,
                subjectId:   currentSubjectId,
                type,
                score,
                trimestre,
                comment,
                date:        new Date().toISOString().split('T')[0],
                studentName: currentStudentForModal.name,
                subjectName: subject?.name || ''
            });

            Swal.fire({ title: '¡Nota registrada!', icon: 'success', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
            renderTrimestreContent();
            renderStudentsByGrade();
            updateQuickStats();
            updateDashboard();
        } else {
            const error = await res.json();
            Swal.fire('Error', error.error || 'No se pudo guardar la nota', 'error');
        }
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

// ==================== ELIMINAR NOTA ====================
async function deleteGrade(gradeId) {
    const result = await Swal.fire({
        title: '¿Eliminar esta nota?', text: 'Esta acción no se puede deshacer', icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#8B0000',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const res = await apiFetch('/notas/', { method: 'DELETE', body: JSON.stringify({ id: gradeId }) });
            if (res.ok) {
                myGrades = myGrades.filter(g => g.id !== gradeId);
                Swal.fire({ title: 'Nota eliminada', icon: 'success', timer: 1200, showConfirmButton: false });
                renderTrimestreContent();
                renderStudentsByGrade();
                updateQuickStats();
                updateDashboard();
            } else {
                const error = await res.json();
                Swal.fire('Error', error.error || 'No se pudo eliminar', 'error');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
}

// ==================== COMENTARIOS ====================
function renderComments() {
    const container = document.getElementById('commentsList');
    if (!container) return;

    if (myComments.length === 0) {
        container.innerHTML = '<div class="comment-card"><i class="fas fa-comment-dots"></i> Aún no hay comentarios de estudiantes</div>';
        return;
    }

    container.innerHTML = myComments.map(c => `
        <div class="comment-card">
            <div class="student"><i class="fas fa-user-graduate"></i> ${escapeHtml(c.estudiante_nombre)}</div>
            <div class="subject"><i class="fas fa-book"></i> ${escapeHtml(c.materia_nombre)}</div>
            <div class="comment"><i class="fas fa-quote-left"></i> "${escapeHtml(c.comentario)}"</div>
            <div class="date"><i class="fas fa-calendar-alt"></i> ${c.fecha ? c.fecha.split(' ')[0] : ''}</div>
        </div>
    `).join('');
}

// ==================== NAVEGACIÓN ====================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const view = this.dataset.view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
        if (view === 'subjects')  renderSubjects();
        if (view === 'grades')    { loadSubjectSelect(); if (currentSubjectId) { document.getElementById('gradeSubject').value = currentSubjectId; changeSubject(); } }
        if (view === 'comments')  renderComments();
    });
});

window.onclick = function (event) {
    const modal = document.getElementById('studentGradesModal');
    if (event.target === modal) closeStudentModal();
};

// ==================== LOGOUT ====================
async function logout() {
    try { await apiFetch('/auth/logout.php', { method: 'POST' }); } catch (e) {}
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ==================== UTILIDADES ====================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ==================== INICIALIZAR ====================
loadData();