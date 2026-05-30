// ==================== VARIABLES GLOBALES ====================
let currentTeacher = null;
let allStudents = [];
let allSubjects = [];
let allGrades = [];
let allEnrollments = [];
let allComments = [];

let currentSubjectId = null;
let currentStudentForModal = null;
let currentTrimestre = 'I Trimestre';

// ==================== CARGA DE DATOS ====================
function loadData() {
    currentTeacher = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentTeacher || currentTeacher.rol !== 'profesor') {
        window.location.href = 'index.html';
        return;
    }
    
    allStudents = JSON.parse(localStorage.getItem('students')) || [];
    allSubjects = JSON.parse(localStorage.getItem('subjects')) || [];
    allGrades = JSON.parse(localStorage.getItem('grades')) || [];
    allEnrollments = JSON.parse(localStorage.getItem('enrollments')) || [];
    allComments = JSON.parse(localStorage.getItem('comments')) || [];
    
    document.getElementById('teacherName').innerHTML = currentTeacher.nombre || 'Profesora';
    document.getElementById('welcomeName').innerHTML = currentTeacher.nombre || 'Profesora';
    
    updateDashboard();
    renderSubjects();
    renderComments();
    loadSubjectSelect();
}

// ==================== FUNCIÓN PARA VERIFICAR PERÍODOS ====================
function canEditPeriod(trimestre) {
    const config = JSON.parse(localStorage.getItem('systemConfig'));
    if (!config) return true;
    
    const periodConfig = config.periods && config.periods[trimestre];
    if (!periodConfig) return true;
    
    // Si el período está abierto, puede editar
    if (periodConfig.open === true) return true;
    
    // Si está cerrado, verificar si el admin permite edición
    return config.allowEditClosedPeriods === true;
}

// ==================== FUNCIONES DE FILTRADO ====================
function getMySubjects() {
    return allSubjects.filter(s => s.teacherId === currentTeacher.id_referencia);
}

function getMySubjectIds() {
    return getMySubjects().map(s => s.id);
}

function getStudentsForSubject(subjectId) {
    const enrolls = allEnrollments.filter(e => e.subjectId === subjectId);
    const studentIds = enrolls.map(e => e.studentId);
    return allStudents.filter(s => studentIds.includes(s.id));
}

function getGradesForStudent(studentId, subjectId = null, trimestre = null) {
    let grades = allGrades.filter(g => g.studentId === studentId);
    if (subjectId) {
        grades = grades.filter(g => g.subjectId === subjectId);
    }
    if (trimestre && trimestre !== 'Todas') {
        grades = grades.filter(g => g.trimestre === trimestre);
    }
    return grades.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getAverageForStudentTrimestre(studentId, subjectId, trimestre) {
    let grades = allGrades.filter(g => g.studentId === studentId && g.subjectId === subjectId);
    if (trimestre && trimestre !== 'Todas') {
        grades = grades.filter(g => g.trimestre === trimestre);
    }
    if (grades.length === 0) return null;
    const sum = grades.reduce((acc, g) => acc + g.score, 0);
    return (sum / grades.length).toFixed(1);
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    const mySubjects = getMySubjects();
    const mySubjectIds = mySubjects.map(s => s.id);
    const myEnrollments = allEnrollments.filter(e => mySubjectIds.includes(e.subjectId));
    const uniqueStudentIds = [...new Set(myEnrollments.map(e => e.studentId))];
    const myGrades = allGrades.filter(g => mySubjectIds.includes(g.subjectId));
    
    document.getElementById('mySubjectsCount').textContent = mySubjects.length;
    document.getElementById('myStudentsCount').textContent = uniqueStudentIds.length;
    document.getElementById('myGradesCount').textContent = myGrades.length;
}

// ==================== MATERIAS ====================
function renderSubjects() {
    const container = document.getElementById('subjectsList');
    const mySubjects = getMySubjects();
    
    if (mySubjects.length === 0) {
        container.innerHTML = '<div class="card" style="text-align:center; padding:40px;"><i class="fas fa-info-circle"></i> Aún no tienes materias asignadas</div>';
        return;
    }
    
    container.innerHTML = mySubjects.map(s => {
        const students = getStudentsForSubject(s.id);
        return `
            <div class="subject-card" onclick="selectSubjectForGrades(${s.id})" style="cursor:pointer;">
                <h4><i class="fas fa-book"></i> ${escapeHtml(s.name)}</h4>
                <p><i class="fas fa-code"></i> Código: ${s.code}</p>
                <p><i class="fas fa-star"></i> Créditos: ${s.credits}</p>
                <p><i class="fas fa-users"></i> Estudiantes: ${students.length}</p>
            </div>
        `;
    }).join('');
}

function selectSubjectForGrades(subjectId) {
    currentSubjectId = subjectId;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-view="grades"]').classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('gradesView').classList.add('active');
    
    const subjectSelect = document.getElementById('gradeSubject');
    subjectSelect.value = subjectId;
    changeSubject();
}

function loadSubjectSelect() {
    const subjectSelect = document.getElementById('gradeSubject');
    const mySubjects = getMySubjects();
    
    subjectSelect.innerHTML = '<option value="">-- Seleccionar una materia --</option>' + 
        mySubjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (${s.code})</option>`).join('');
}

// ==================== GESTIÓN DE NOTAS ====================
function changeSubject() {
    currentSubjectId = parseInt(document.getElementById('gradeSubject').value);
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
    const totalStudents = students.length;
    
    let totalGrades = 0;
    let approved = 0;
    let failed = 0;
    let studentsWithGrades = 0;
    
    students.forEach(student => {
        const avg = getAverageForStudentTrimestre(student.id, currentSubjectId, null);
        if (avg !== null) {
            const avgNum = parseFloat(avg);
            totalGrades += avgNum;
            studentsWithGrades++;
            if (avgNum >= 3) approved++;
            else failed++;
        }
    });
    
    const avgGroup = studentsWithGrades > 0 ? (totalGrades / studentsWithGrades).toFixed(1) : 0;
    
    document.getElementById('statTotalStudents').textContent = totalStudents;
    document.getElementById('statAvgGrade').textContent = avgGroup;
    document.getElementById('statApproved').textContent = approved;
    document.getElementById('statFailed').textContent = failed;
}

function renderStudentsByGrade() {
    let students = getStudentsForSubject(currentSubjectId);
    
    students.sort((a, b) => a.name.localeCompare(b.name));
    
    const gradesOrder = ['9°', '10°', '11°', '12°'];
    const grouped = {};
    
    students.forEach(student => {
        const grade = student.grade || 'Sin grado';
        if (!grouped[grade]) grouped[grade] = [];
        grouped[grade].push(student);
    });
    
    const sortedGrades = Object.keys(grouped).sort((a, b) => {
        const indexA = gradesOrder.indexOf(a);
        const indexB = gradesOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    
    const container = document.getElementById('studentsByGrade');
    
    if (students.length === 0) {
        container.innerHTML = '<div class="card" style="text-align:center; padding:40px;"><i class="fas fa-user-graduate"></i> No hay estudiantes matriculados en esta materia</div>';
        return;
    }
    
    container.innerHTML = sortedGrades.map(grade => {
        const gradeStudents = grouped[grade];
        return `
            <div class="grade-section">
                <div class="grade-header" onclick="toggleGradeSection(this)">
                    <span><i class="fas fa-graduation-cap"></i> Grado ${grade} (${gradeStudents.length} estudiantes)</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="grade-students">
                    ${gradeStudents.map(student => renderStudentCard(student)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderStudentCard(student) {
    const avg = getAverageForStudentTrimestre(student.id, currentSubjectId, null);
    
    return `
        <div class="student-grade-card" onclick="openStudentGradesModal(${student.id})">
            <div class="student-info">
                <div class="student-name">
                    <i class="fas fa-user"></i> ${escapeHtml(student.name)}
                </div>
                <div class="student-email">
                    <i class="fas fa-envelope"></i> ${escapeHtml(student.email)}
                </div>
            </div>
            <div class="grades-info">
                ${avg !== null ? `
                    <div class="current-grade">
                        <i class="fas fa-chart-line"></i> Promedio General: <strong style="font-size:16px;">${avg}</strong>
                        <span class="${parseFloat(avg) >= 3 ? 'grade-badge' : 'grade-badge low'}" style="margin-left:8px;">
                            ${parseFloat(avg) >= 3 ? '<i class="fas fa-check"></i> Aprobado' : '<i class="fas fa-rotate"></i> En proceso'}
                        </span>
                    </div>
                ` : '<div class="current-grade"><i class="fas fa-info-circle"></i> Sin notas registradas</div>'}
                <div style="font-size:12px; color:#b37b92;">
                    <i class="fas fa-click"></i> Click para ver detalle completo
                </div>
            </div>
        </div>
    `;
}

function toggleGradeSection(element) {
    element.classList.toggle('collapsed');
    const studentsDiv = element.nextElementSibling;
    studentsDiv.classList.toggle('collapsed');
}

// ==================== MODAL DE NOTAS DETALLADO ====================
function openStudentGradesModal(studentId) {
    currentStudentForModal = allStudents.find(s => s.id === studentId);
    if (!currentStudentForModal) return;
    
    renderStudentModal();
    document.getElementById('studentGradesModal').style.display = 'flex';
}

function closeStudentModal() {
    document.getElementById('studentGradesModal').style.display = 'none';
}

function renderStudentModal() {
    const container = document.getElementById('studentModalContent');
    const subject = allSubjects.find(s => s.id === currentSubjectId);
    
    container.innerHTML = `
        <div class="student-header">
            <div class="student-avatar"><i class="fas fa-user-graduate"></i></div>
            <div class="student-details">
                <h3><i class="fas fa-user"></i> ${escapeHtml(currentStudentForModal.name)}</h3>
                <p><i class="fas fa-envelope"></i> ${escapeHtml(currentStudentForModal.email)} | <i class="fas fa-graduation-cap"></i> Grado ${currentStudentForModal.grade}</p>
                <p><i class="fas fa-book"></i> Materia: ${escapeHtml(subject.name)} (${subject.code})</p>
            </div>
        </div>
        
        <div class="trimestre-tabs">
            <button class="trimestre-tab ${currentTrimestre === 'I Trimestre' ? 'active' : ''}" onclick="changeTrimestre('I Trimestre')"><i class="fas fa-calendar-alt"></i> I Trimestre</button>
            <button class="trimestre-tab ${currentTrimestre === 'II Trimestre' ? 'active' : ''}" onclick="changeTrimestre('II Trimestre')"><i class="fas fa-calendar-alt"></i> II Trimestre</button>
            <button class="trimestre-tab ${currentTrimestre === 'III Trimestre' ? 'active' : ''}" onclick="changeTrimestre('III Trimestre')"><i class="fas fa-calendar-alt"></i> III Trimestre</button>
            <button class="trimestre-tab ${currentTrimestre === 'Todas' ? 'active' : ''}" onclick="changeTrimestre('Todas')"><i class="fas fa-list"></i> Todas las notas</button>
        </div>
        
        <div id="modalTrimestreContent"></div>
    `;
    
    renderTrimestreContent();
}

function renderTrimestreContent() {
    const container = document.getElementById('modalTrimestreContent');
    const subject = allSubjects.find(s => s.id === currentSubjectId);
    
    let grades = [];
    let showAvg = false;
    let avg = null;
    
    if (currentTrimestre === 'Todas') {
        grades = getGradesForStudent(currentStudentForModal.id, currentSubjectId);
        showAvg = false;
    } else {
        grades = getGradesForStudent(currentStudentForModal.id, currentSubjectId, currentTrimestre);
        avg = getAverageForStudentTrimestre(currentStudentForModal.id, currentSubjectId, currentTrimestre);
        showAvg = true;
    }
    
    // Verificar si el período está cerrado para mostrar advertencia
    const isPeriodLocked = !canEditPeriod(currentTrimestre) && currentTrimestre !== 'Todas';
    const lockWarning = isPeriodLocked ? `
        <div style="background: #ffe0e0; border-radius: 15px; padding: 12px; margin-bottom: 20px; text-align: center; border-left: 4px solid #ff6666;">
            <i class="fas fa-lock" style="color: #ff6666;"></i>
            <strong style="color: #cc5555;">Período Cerrado</strong>
            <p style="font-size: 13px; margin-top: 5px;">El ${currentTrimestre} está cerrado para calificaciones. No puedes agregar, modificar o eliminar notas.</p>
        </div>
    ` : '';
    
    container.innerHTML = `
        ${lockWarning}
        ${showAvg ? `
            <div class="period-avg">
                <i class="fas fa-chart-line"></i> Promedio de ${currentTrimestre}: 
                <span>${avg !== null ? avg : 'Sin notas'}</span>
                ${avg !== null && parseFloat(avg) >= 3 ? '<i class="fas fa-trophy"></i> Aprobado' : avg !== null ? '<i class="fas fa-rotate"></i> En proceso' : ''}
            </div>
        ` : ''}
        
        <div class="add-grade-section">
            <div class="add-grade-title"><i class="fas fa-plus-circle"></i> Agregar nueva evaluación</div>
            <div class="grade-form-row">
                <div class="form-group">
                    <label>Tipo de evaluación</label>
                    <select id="newGradeType" class="grade-type-select" ${isPeriodLocked ? 'disabled' : ''}>
                        <option value="parcial">Parcial</option>
                        <option value="taller">Taller</option>
                        <option value="tarea">Tarea</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Nota (1.0 - 5.0)</label>
                    <input type="number" id="newGradeScore" step="0.1" min="1" max="5" placeholder="Ej: 4.5" ${isPeriodLocked ? 'disabled' : ''}>
                </div>
                <div class="form-group" style="flex:2">
                    <label>Comentario / Descripción</label>
                    <input type="text" id="newGradeComment" placeholder="Ej: Examen final unidad 1, Taller de reforzamiento..." ${isPeriodLocked ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                    <button class="btn-primary" onclick="addNewGrade()" style="margin-top: 22px;" ${isPeriodLocked ? 'disabled' : ''}>
                        <i class="fas fa-save"></i> Guardar nota
                    </button>
                </div>
            </div>
        </div>
        
        <div class="grades-history">
            <div class="grades-history-title">
                <i class="fas fa-history"></i> 
                ${currentTrimestre === 'Todas' ? 'Historial completo de notas' : `Notas del ${currentTrimestre}`}
                (${grades.length} registros)
            </div>
            <div id="gradesHistoryList">
                ${grades.length === 0 ? '<div style="text-align:center; padding:40px; color:#b37b92;"><i class="fas fa-inbox"></i> No hay notas registradas en este período</div>' : ''}
                ${grades.map(grade => renderGradeHistoryItem(grade, isPeriodLocked)).join('')}
            </div>
        </div>
    `;
}

function renderGradeHistoryItem(grade, isPeriodLocked) {
    const typeLabels = { parcial: '<i class="fas fa-pen"></i> Parcial', taller: '<i class="fas fa-tools"></i> Taller', tarea: '<i class="fas fa-house"></i> Tarea' };
    const typeClass = grade.type || 'parcial';
    
    // Verificar si esta nota específica está en un período cerrado
    const isGradeLocked = !canEditPeriod(grade.trimestre) && grade.trimestre !== 'General';
    
    return `
        <div class="grade-history-item ${typeClass}">
            <div class="grade-info">
                <div>
                    <span class="grade-type-badge ${typeClass}">${typeLabels[typeClass]}</span>
                    <span class="grade-score">${grade.score}</span>
                </div>
                ${grade.comment ? `<div class="grade-comment"><i class="fas fa-quote-left"></i> ${escapeHtml(grade.comment)}</div>` : ''}
                <div class="grade-date"><i class="fas fa-calendar-alt"></i> Registrada: ${grade.date} | Trimestre: ${grade.trimestre || 'General'}</div>
            </div>
            <div class="grade-actions">
                <button class="delete-grade-btn" onclick="deleteGrade(${grade.id})" ${isGradeLocked || isPeriodLocked ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
}

function changeTrimestre(trimestre) {
    currentTrimestre = trimestre;
    renderTrimestreContent();
    
    // Actualizar tabs activos
    document.querySelectorAll('.trimestre-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(trimestre === 'Todas' ? 'Todas' : trimestre)) {
            tab.classList.add('active');
        }
    });
}

// ==================== AGREGAR NOTA (con verificación de período) ====================
async function addNewGrade() {
    // Verificar si se puede editar en este período
    if (!canEditPeriod(currentTrimestre) && currentTrimestre !== 'Todas') {
        Swal.fire({
            title: '<i class="fas fa-lock"></i> Período Cerrado',
            html: `El <strong>${currentTrimestre}</strong> está cerrado para calificaciones.<br><br>
                   No se pueden agregar, modificar o eliminar notas en este período.<br>
                   Contacta al administrador si necesitas hacer cambios.`,
            icon: 'error',
            confirmButtonColor: '#C9A84C'
        });
        return;
    }
    
    const type = document.getElementById('newGradeType').value;
    const score = parseFloat(document.getElementById('newGradeScore').value);
    const comment = document.getElementById('newGradeComment').value.trim();
    const subject = allSubjects.find(s => s.id === currentSubjectId);
    
    if (isNaN(score) || score < 1 || score > 5) {
        Swal.fire('Error', 'La nota debe ser un número entre 1.0 y 5.0', 'error');
        return;
    }
    
    const newGrade = {
        id: Date.now(),
        studentId: currentStudentForModal.id,
        studentName: currentStudentForModal.name,
        subjectId: currentSubjectId,
        subjectName: subject.name,
        type: type,
        score: score,
        comment: comment,
        trimestre: currentTrimestre === 'Todas' ? 'General' : currentTrimestre,
        date: new Date().toLocaleDateString(),
        teacherId: currentTeacher.id_referencia,
    };
    
    allGrades.push(newGrade);
    localStorage.setItem('grades', JSON.stringify(allGrades));
    
    Swal.fire({
        title: '¡Nota registrada!',
        text: `${currentStudentForModal.name} - ${subject.name}: ${score} (${type})`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
    
    document.getElementById('newGradeScore').value = '';
    document.getElementById('newGradeComment').value = '';
    
    renderTrimestreContent();
    renderStudentsByGrade();
    updateQuickStats();
    updateDashboard();
}

// ==================== ELIMINAR NOTA (con verificación de período) ====================
async function deleteGrade(gradeId) {
    // Buscar la nota para saber su trimestre
    const gradeToDelete = allGrades.find(g => g.id === gradeId);
    if (gradeToDelete && gradeToDelete.trimestre !== 'General') {
        if (!canEditPeriod(gradeToDelete.trimestre)) {
            Swal.fire({
                title: '<i class="fas fa-lock"></i> Período Cerrado',
                html: `No puedes eliminar notas del <strong>${gradeToDelete.trimestre}</strong> porque está cerrado.`,
                icon: 'error',
                confirmButtonColor: '#C9A84C'
            });
            return;
        }
    }
    
    const result = await Swal.fire({
        title: '¿Eliminar esta nota?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#C9A84C',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        allGrades = allGrades.filter(g => g.id !== gradeId);
        localStorage.setItem('grades', JSON.stringify(allGrades));
        
        Swal.fire('Eliminada', 'La nota ha sido eliminada', 'success');
        
        renderTrimestreContent();
        renderStudentsByGrade();
        updateQuickStats();
        updateDashboard();
    }
}

// ==================== COMENTARIOS ====================
function renderComments() {
    const container = document.getElementById('commentsList');
    if (!container) return;
    
    const mySubjectIds = getMySubjectIds();
    const myComments = allComments.filter(c => mySubjectIds.includes(c.subjectId)).reverse();
    
    if (myComments.length === 0) {
        container.innerHTML = '<div class="comment-card"><i class="fas fa-comment-dots"></i> Aún no hay comentarios de estudiantes</div>';
        return;
    }
    
    container.innerHTML = myComments.map(c => `
        <div class="comment-card">
            <div class="student"><i class="fas fa-user-graduate"></i> ${escapeHtml(c.studentName)}</div>
            <div class="subject"><i class="fas fa-book"></i> ${escapeHtml(c.subjectName)}</div>
            <div class="comment"><i class="fas fa-quote-left"></i> "${escapeHtml(c.comment)}"</div>
            <div class="date"><i class="fas fa-calendar-alt"></i> ${c.date}</div>
        </div>
    `).join('');
}

// ==================== NAVEGACIÓN ====================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const view = this.dataset.view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        if (view === 'subjects') renderSubjects();
        if (view === 'grades') {
            loadSubjectSelect();
            if (currentSubjectId) {
                document.getElementById('gradeSubject').value = currentSubjectId;
                changeSubject();
            }
        }
        if (view === 'comments') renderComments();
        
        document.getElementById(`${view}View`).classList.add('active');
    });
});

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('studentGradesModal');
    if (event.target === modal) {
        closeStudentModal();
    }
}

// ==================== UTILERÍAS ====================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ==================== INICIALIZAR ====================
loadData();