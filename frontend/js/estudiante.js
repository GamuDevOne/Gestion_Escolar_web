// ==================== VARIABLES GLOBALES ====================
let currentStudent = null;
let myEnrollments  = [];
let myGrades       = [];
let mySubjects     = [];

const TRIMESTRES = ['I Trimestre', 'II Trimestre', 'III Trimestre'];

// ==================== CARGA DE DATOS ====================
async function loadData() {
    currentStudent = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentStudent || currentStudent.rol !== 'estudiante') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('studentName').textContent = currentStudent.nombre || 'Estudiante';
    document.getElementById('welcomeName').textContent = currentStudent.nombre || 'Estudiante';

    try {
        const [enrollmentsRes, gradesRes, subjectsRes] = await Promise.all([
            apiFetch('/matriculas/'),
            apiFetch('/notas/'),
            apiFetch('/materias/')
        ]);

        if (!enrollmentsRes.ok) throw new Error('Error cargando matrículas');
        if (!gradesRes.ok)      throw new Error('Error cargando notas');
        if (!subjectsRes.ok)    throw new Error('Error cargando materias');

        const enrollmentsJson = await enrollmentsRes.json();
        const gradesJson      = await gradesRes.json();
        const subjectsJson    = await subjectsRes.json();

        const allEnrollments = enrollmentsJson.data ?? enrollmentsJson;
        const allGrades      = gradesJson.data      ?? gradesJson;
        const allSubjects    = subjectsJson.data    ?? subjectsJson;

        // El servidor ya filtró matrículas y notas de este estudiante
        myEnrollments = allEnrollments;
        myGrades = allGrades.map(g => ({
            id:        g.id,
            subjectId: parseInt(g.materia_id),
            type:      g.tipo,
            score:     parseFloat(g.puntaje),
            trimestre: g.trimestre,
            comment:   g.comentario || '',
            date:      g.fecha_registro ? g.fecha_registro.split(' ')[0] : ''
        }));

        const enrolledSubjectIds = myEnrollments.map(e => parseInt(e.subjectId));
        mySubjects = allSubjects.filter(s => enrolledSubjectIds.includes(parseInt(s.id)));

        updateDashboard();
        renderGradesReport();
        loadCommentSubjects();
        await renderMyComments();

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los datos: ' + error.message, 'error');
    }
}

// ==================== FILTRADO ====================
function getGradesForSubjectTrimestre(subjectId, trimestre) {
    return myGrades.filter(g => g.subjectId === subjectId && g.trimestre === trimestre);
}

function getAverageForSubjectTrimestre(subjectId, trimestre) {
    const grades = getGradesForSubjectTrimestre(subjectId, trimestre);
    if (grades.length === 0) return null;
    return (grades.reduce((acc, g) => acc + g.score, 0) / grades.length).toFixed(1);
}

function getGeneralAverage() {
    let totalSum = 0, subjectCount = 0;
    for (const subject of mySubjects) {
        let subjectTotal = 0, trimestreCount = 0;
        for (const trimestre of TRIMESTRES) {
            const avg = getAverageForSubjectTrimestre(subject.id, trimestre);
            if (avg !== null) { subjectTotal += parseFloat(avg); trimestreCount++; }
        }
        if (trimestreCount > 0) { totalSum += subjectTotal / trimestreCount; subjectCount++; }
    }
    return subjectCount > 0 ? (totalSum / subjectCount).toFixed(1) : 0;
}

function getApprovedCount() {
    let approved = 0;
    for (const subject of mySubjects) {
        let subjectTotal = 0, trimestreCount = 0;
        for (const trimestre of TRIMESTRES) {
            const avg = getAverageForSubjectTrimestre(subject.id, trimestre);
            if (avg !== null) { subjectTotal += parseFloat(avg); trimestreCount++; }
        }
        if (trimestreCount > 0 && subjectTotal / trimestreCount >= 3) approved++;
    }
    return approved;
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    document.getElementById('mySubjectsCount').textContent = mySubjects.length;
    document.getElementById('myAverage').textContent       = getGeneralAverage();
    document.getElementById('approvedCount').textContent   = getApprovedCount();
}

// ==================== REPORTE DE NOTAS ====================
function renderGradesReport() {
    const container  = document.getElementById('gradesReport');
    const generalAvg = getGeneralAverage();

    if (mySubjects.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="fas fa-info-circle" style="font-size:50px; color:var(--gold);"></i>
                <p style="margin-top:15px; font-family:'Cinzel',serif; color:var(--crimson-deep);">Aún no estás matriculado en ninguna materia</p>
                <p style="font-size:13px; color:#8a7055;">Contacta al administrador para asignar tus materias</p>
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

    for (const trimestre of TRIMESTRES) {
        html += renderTrimestreSection(trimestre);
    }

    container.innerHTML = html;

    document.querySelectorAll('.trimestre-header').forEach(header => {
        header.addEventListener('click', function () {
            this.classList.toggle('collapsed');
            this.nextElementSibling.classList.toggle('collapsed');
        });
    });
}

function renderTrimestreSection(trimestre) {
    let hasAnyGrade = false, trimestreTotal = 0, trimestreCount = 0;

    const subjectRows = mySubjects.map(subject => {
        const grades = getGradesForSubjectTrimestre(subject.id, trimestre);
        const avg    = getAverageForSubjectTrimestre(subject.id, trimestre);
        if (avg !== null) { hasAnyGrade = true; trimestreTotal += parseFloat(avg); trimestreCount++; }
        return renderSubjectRow(subject, grades, avg);
    }).join('');

    const trimestreAvg = trimestreCount > 0 ? (trimestreTotal / trimestreCount).toFixed(1) : null;

    return `
        <div class="trimestre-container">
            <div class="trimestre-header">
                <div class="trimestre-title"><i class="fas fa-calendar-alt"></i> ${trimestre}</div>
                <div class="trimestre-average">
                    ${trimestreAvg !== null
                        ? `<span class="value">Promedio: ${trimestreAvg}</span>`
                        : `<span class="empty"><i class="fas fa-chart-simple"></i> Sin notas registradas</span>`
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
                        <tbody>${subjectRows}</tbody>
                    </table>
                ` : `
                    <div style="text-align:center; padding:30px; color:#8a7055;">
                        <i class="fas fa-inbox" style="font-size:40px; margin-bottom:10px; display:block;"></i>
                        No hay notas registradas en ${trimestre.toLowerCase()}
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderSubjectRow(subject, grades, avg) {
    const typeIcons  = { parcial: '<i class="fas fa-pen"></i>', taller: '<i class="fas fa-tools"></i>', tarea: '<i class="fas fa-home"></i>' };
    const typeLabels = { parcial: 'Parcial', taller: 'Taller', tarea: 'Tarea' };

    const gradesHtml = grades.length > 0
        ? '<div class="grades-list">' + grades.map(g => `
            <div class="grade-item ${g.type}" title="${escapeHtml(g.comment || typeLabels[g.type])}">
                ${typeIcons[g.type] || ''} <span class="grade-score">${g.score}</span>
                ${g.comment ? `<span class="grade-comment">(${escapeHtml(g.comment.substring(0, 20))}${g.comment.length > 20 ? '...' : ''})</span>` : ''}
            </div>
        `).join('') + '</div>'
        : '<span class="no-grades"><i class="fas fa-minus-circle"></i> Sin notas</span>';

    let statusHtml = '<span class="status-badge empty"><i class="fas fa-question-circle"></i> Sin definir</span>';
    if (avg !== null) {
        statusHtml = parseFloat(avg) >= 3
            ? '<span class="status-badge approved"><i class="fas fa-check"></i> Aprobado</span>'
            : '<span class="status-badge failed"><i class="fas fa-clock"></i> En proceso</span>';
    }

    return `
        <tr>
            <td class="subject-name">${escapeHtml(subject.name)}</td>
            <td>${gradesHtml}</td>
            <td class="subject-average">${avg !== null ? `<span class="value">${avg}</span>` : '<span class="empty">S/N</span>'}</td>
            <td>${statusHtml}</td>
        </tr>
    `;
}

// ==================== COMENTARIOS ====================
function loadCommentSubjects() {
    const select = document.getElementById('commentSubject');
    if (mySubjects.length === 0) {
        select.innerHTML = '<option value="">-- No hay materias disponibles --</option>';
        return;
    }
    select.innerHTML = '<option value="">-- Seleccionar materia --</option>' +
        mySubjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
}

async function sendComment() {
    const subjectId = parseInt(document.getElementById('commentSubject').value);
    const comment   = document.getElementById('commentText').value.trim();

    if (!subjectId || !comment) {
        Swal.fire('Error', 'Por favor selecciona una materia y escribe tu comentario', 'error');
        return;
    }

    try {
        const res = await apiFetch('/comentarios/', {
            method: 'POST',
            body: JSON.stringify({ materia_id: subjectId, comentario: comment })
        });

        if (res.ok) {
            Swal.fire({ title: '¡Comentario enviado!', icon: 'success', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
            document.getElementById('commentText').value    = '';
            document.getElementById('commentSubject').value = '';
            await renderMyComments();
        } else {
            const error = await res.json();
            Swal.fire('Error', error.error || 'No se pudo enviar el comentario', 'error');
        }
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

async function renderMyComments() {
    const container = document.getElementById('myCommentsList');
    try {
        const res = await apiFetch('/comentarios/');
        if (!res.ok) throw new Error();
        const json     = await res.json();
        const comments = json.data ?? json;

        if (comments.length === 0) {
            container.innerHTML = '<div class="comment-card"><i class="fas fa-comment-dots"></i> Aún no has enviado comentarios</div>';
            return;
        }

        container.innerHTML = comments.map(c => `
            <div class="comment-card">
                <div class="subject"><i class="fas fa-book"></i> ${escapeHtml(c.materia_nombre)}</div>
                <div class="comment">"${escapeHtml(c.comentario)}"</div>
                <div class="date"><i class="fas fa-calendar-alt"></i> ${c.fecha ? c.fecha.split(' ')[0] : ''}</div>
            </div>
        `).join('');
    } catch {
        container.innerHTML = '<div class="comment-card">Error al cargar comentarios</div>';
    }
}

// ==================== NAVEGACIÓN ====================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const view = this.dataset.view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
        if (view === 'grades')   renderGradesReport();
        if (view === 'comments') { loadCommentSubjects(); renderMyComments(); }
    });
});

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