// ==================== VARIABLES GLOBALES ====================
let currentStudent = null;
let allStudents = [];
let allSubjects = [];
let allGrades = [];
let allEnrollments = [];
let allComments = [];

// Trimestres disponibles
const TRIMESTRES = ['I Trimestre', 'II Trimestre', 'III Trimestre'];

// ==================== CARGA DE DATOS ====================
function loadData() {
    currentStudent = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentStudent || currentStudent.rol !== 'estudiante') {
        window.location.href = 'index.html';
        return;
    }
    
    allStudents = JSON.parse(localStorage.getItem('students')) || [];
    allSubjects = JSON.parse(localStorage.getItem('subjects')) || [];
    allGrades = JSON.parse(localStorage.getItem('grades')) || [];
    allEnrollments = JSON.parse(localStorage.getItem('enrollments')) || [];
    allComments = JSON.parse(localStorage.getItem('comments')) || [];
    
    const studentData = allStudents.find(s => s.id === currentStudent.id_referencia);
    if (studentData) {
        document.getElementById('studentName').innerHTML = studentData.name;
        document.getElementById('welcomeName').innerHTML = studentData.name;
    }
    
    updateDashboard();
    renderGradesReport();
    loadCommentSubjects();
    renderMyComments();
}

// ==================== FUNCIONES DE FILTRADO ====================
function getMySubjects() {
    const myEnrollments = allEnrollments.filter(e => e.studentId === currentStudent.id_referencia);
    const subjectIds = myEnrollments.map(e => e.subjectId);
    return allSubjects.filter(s => subjectIds.includes(s.id));
}

function getMyGradesForSubject(subjectId, trimestre = null) {
    let grades = allGrades.filter(g => g.studentId === currentStudent.id_referencia && g.subjectId === subjectId);
    if (trimestre) {
        grades = grades.filter(g => g.trimestre === trimestre);
    }
    return grades;
}

function getAverageForSubjectTrimestre(subjectId, trimestre) {
    const grades = getMyGradesForSubject(subjectId, trimestre);
    if (grades.length === 0) return null;
    const sum = grades.reduce((acc, g) => acc + g.score, 0);
    return (sum / grades.length).toFixed(1);
}

function getGeneralAverage() {
    const mySubjects = getMySubjects();
    let totalSum = 0;
    let subjectCount = 0;
    
    for (const subject of mySubjects) {
        let subjectTotal = 0;
        let trimestreCount = 0;
        
        for (const trimestre of TRIMESTRES) {
            const avg = getAverageForSubjectTrimestre(subject.id, trimestre);
            if (avg !== null) {
                subjectTotal += parseFloat(avg);
                trimestreCount++;
            }
        }
        
        if (trimestreCount > 0) {
            totalSum += subjectTotal / trimestreCount;
            subjectCount++;
        }
    }
    
    return subjectCount > 0 ? (totalSum / subjectCount).toFixed(1) : 0;
}

function getApprovedSubjectsCount() {
    const mySubjects = getMySubjects();
    let approved = 0;
    
    for (const subject of mySubjects) {
        let subjectTotal = 0;
        let trimestreCount = 0;
        
        for (const trimestre of TRIMESTRES) {
            const avg = getAverageForSubjectTrimestre(subject.id, trimestre);
            if (avg !== null) {
                subjectTotal += parseFloat(avg);
                trimestreCount++;
            }
        }
        
        if (trimestreCount > 0) {
            const finalAvg = subjectTotal / trimestreCount;
            if (finalAvg >= 3) approved++;
        }
    }
    
    return approved;
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    const mySubjects = getMySubjects();
    const generalAvg = getGeneralAverage();
    const approved = getApprovedSubjectsCount();
    
    document.getElementById('mySubjectsCount').textContent = mySubjects.length;
    document.getElementById('myAverage').textContent = generalAvg;
    document.getElementById('approvedCount').textContent = approved;
}

// ==================== REPORTE DE NOTAS POR TRIMESTRE ====================
function renderGradesReport() {
    const container = document.getElementById('gradesReport');
    const mySubjects = getMySubjects();
    const generalAvg = getGeneralAverage();
    
    if (mySubjects.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="fas fa-info-circle" style="font-size:50px; color:#ff99bb;"></i>
                <p style="margin-top:15px;">Aún no estás matriculado en ninguna materia</p>
                <p style="font-size:13px; color:#b37b92;">Contacta al administrador para asignar tus materias</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="report-header">
            <h3><i class="fas fa-chart-line"></i> Reporte Académico</h3>
            <div class="general-average">
                <div class="label"><i class="fas fa-chart-simple"></i> Promedio General</div>
                <div class="value">${generalAvg}</div>
            </div>
        </div>
    `;
    
    // Renderizar cada trimestre
    for (const trimestre of TRIMESTRES) {
        html += renderTrimestreSection(trimestre, mySubjects);
    }
    
    container.innerHTML = html;
    
    // Agregar event listeners para colapsar/expandir
    document.querySelectorAll('.trimestre-header').forEach(header => {
        header.addEventListener('click', function(e) {
            if (e.target.tagName !== 'I' && e.target.tagName !== 'BUTTON') {
                this.classList.toggle('collapsed');
                const content = this.nextElementSibling;
                content.classList.toggle('collapsed');
            }
        });
    });
}

function renderTrimestreSection(trimestre, subjects) {
    let hasAnyGrade = false;
    let trimestreTotal = 0;
    let trimestreCount = 0;
    
    // Primero, calcular el promedio del trimestre y verificar si hay notas
    const subjectRows = subjects.map(subject => {
        const avg = getAverageForSubjectTrimestre(subject.id, trimestre);
        const grades = getMyGradesForSubject(subject.id, trimestre);
        
        if (avg !== null) {
            hasAnyGrade = true;
            trimestreTotal += parseFloat(avg);
            trimestreCount++;
        }
        
        return renderSubjectRow(subject, trimestre, grades, avg);
    }).join('');
    
    const trimestreAvg = trimestreCount > 0 ? (trimestreTotal / trimestreCount).toFixed(1) : null;
    
    return `
        <div class="trimestre-container">
            <div class="trimestre-header">
                <div class="trimestre-title">
                    <i class="fas fa-calendar-alt"></i> ${trimestre}
                </div>
                <div class="trimestre-average">
                    ${trimestreAvg !== null ? 
                        `<span class="value">Promedio: ${trimestreAvg}</span>` : 
                        `<span class="empty"><i class="fas fa-chart-simple"></i> Sin notas registradas</span>`
                    }
                </div>
            </div>
            <div class="trimestre-content">
                ${hasAnyGrade ? `
                    <table class="subjects-table">
                        <thead>
                            <tr>
                                <th><i class="fas fa-book"></i> Materia</th>
                                <th><i class="fas fa-pen"></i> Notas</th>
                                <th><i class="fas fa-bullseye"></i> Promedio</th>
                                <th><i class="fas fa-circle-check"></i> Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjectRows}
                        </tbody>
                    </table>
                ` : `
                    <div style="text-align:center; padding:30px; color:#b37b92;">
                        <i class="fas fa-inbox" style="font-size:40px; margin-bottom:10px; display:block;"></i>
                        No hay notas registradas en ${trimestre.toLowerCase()}
                        <p style="font-size:12px; margin-top:8px;"><i class="fas fa-circle-info"></i> Las notas aparecerán aquí cuando el profesor las registre</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderSubjectRow(subject, trimestre, grades, avg) {
    // Renderizar lista de notas con sus tipos
    let gradesHtml = '';
    
    if (grades.length > 0) {
        const typeIcons = {
            parcial: '<i class="fas fa-pen"></i>',
            taller: '<i class="fas fa-tools"></i>',
            tarea: '<i class="fas fa-home"></i>'
        };
        const typeLabels = {
            parcial: 'Parcial',
            taller: 'Taller',
            tarea: 'Tarea'
        };
        
        gradesHtml = '<div class="grades-list">';
        grades.forEach(grade => {
            const type = grade.type || 'parcial';
            gradesHtml += `
                <div class="grade-item ${type}" title="${grade.comment || typeLabels[type]}">
                    ${typeIcons[type]} 
                    <span class="grade-score">${grade.score}</span>
                    ${grade.comment ? `<span class="grade-comment">(${escapeHtml(grade.comment.substring(0, 20))}${grade.comment.length > 20 ? '...' : ''})</span>` : ''}
                </div>
            `;
        });
        gradesHtml += '</div>';
    } else {
        gradesHtml = '<span class="no-grades"><i class="fas fa-minus-circle"></i> S/N (Sin notas)</span>';
    }
    
    // Estado según promedio
    let statusHtml = '';
    if (avg !== null) {
        const avgNum = parseFloat(avg);
        if (avgNum >= 3) {
            statusHtml = '<span class="status-badge approved"><i class="fas fa-check"></i> Aprobado</span>';
        } else {
            statusHtml = '<span class="status-badge failed"><i class="fas fa-clock"></i> En proceso</span>';
        }
    } else {
        statusHtml = '<span class="status-badge empty"><i class="fas fa-question-circle"></i> Sin definir</span>';
    }
    
    // Promedio con formato
    const avgHtml = avg !== null ? 
        `<span class="value">${avg}</span>` : 
        '<span class="empty">S/N</span>';
    
    return `
        <tr>
            <td class="subject-name">${escapeHtml(subject.name)}</td>
            <td>${gradesHtml}</td>
            <td class="subject-average">${avgHtml}</td>
            <td>${statusHtml}</td>
        </tr>
    `;
}

// ==================== COMENTARIOS ====================
function loadCommentSubjects() {
    const select = document.getElementById('commentSubject');
    const mySubjects = getMySubjects();
    
    if (mySubjects.length === 0) {
        select.innerHTML = '<option value="">-- No hay materias disponibles --</option>';
        return;
    }
    
    select.innerHTML = '<option value="">-- Seleccionar materia --</option>' + 
        mySubjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
}

function sendComment() {
    const subjectId = parseInt(document.getElementById('commentSubject').value);
    const comment = document.getElementById('commentText').value.trim();
    
    if (!subjectId || !comment) {
        Swal.fire('Error', 'Por favor selecciona una materia y escribe tu comentario', 'error');
        return;
    }
    
    const subject = allSubjects.find(s => s.id === subjectId);
    const student = allStudents.find(s => s.id === currentStudent.id_referencia);
    
    const newComment = {
        id: Date.now(),
        studentId: currentStudent.id_referencia,
        studentName: student.name,
        subjectId,
        subjectName: subject.name,
        comment,
        date: new Date().toLocaleDateString()
    };
    
    allComments.push(newComment);
    localStorage.setItem('comments', JSON.stringify(allComments));
    
    Swal.fire({
        title: '¡Comentario enviado!',
        text: 'Tu profesor lo verá pronto',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
    
    document.getElementById('commentText').value = '';
    document.getElementById('commentSubject').value = '';
    renderMyComments();
}

function renderMyComments() {
    const container = document.getElementById('myCommentsList');
    const myComments = allComments.filter(c => c.studentId === currentStudent.id_referencia).reverse();
    
    if (myComments.length === 0) {
        container.innerHTML = '<div class="comment-card"><i class="fas fa-comment-dots"></i> Aún no has enviado comentarios</div>';
        return;
    }
    
    container.innerHTML = myComments.map(c => `
        <div class="comment-card">
            <div class="student"><i class="fas fa-book"></i> ${escapeHtml(c.subjectName)}</div>
            <div class="comment">"${escapeHtml(c.comment)}"</div>
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
        
        if (view === 'grades') {
            renderGradesReport();
        }
        if (view === 'comments') {
            loadCommentSubjects();
            renderMyComments();
        }
        
        document.getElementById(`${view}View`).classList.add('active');
    });
});

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