# Spec Frontend — Nuevo Modelo de Calificaciones (Panamá)

Backend ya actualizado (`api/notas/index.php` + tabla `nota`). Este documento describe
qué cambia en `frontend/js/profesor.js` y `frontend/js/estudiante.js`.

---

## 1. Cambios en el modelo de datos

La tabla `nota` ahora tiene:

| Campo | Antes | Ahora |
|---|---|---|
| `tipo` | `'parcial'\|'taller'\|'tarea'` | `'PARCIAL'\|'EXAMEN_TRIMESTRAL'\|'APRECIACION'` |
| `tipo_actividad` | — | **NUEVO**, opcional, string |
| `nombre` | — | **NUEVO**, opcional, string (nombre de la actividad) |

`tipo_actividad` valores permitidos (lista cerrada, opcional):
```
Quiz, Parcial, Taller, Tarea, Proyecto, Investigacion, Exposicion, Laboratorio, Participacion, Otro
```

---

## 2. Reglas de negocio (importante para la lógica de cálculo)

| Categoría (`tipo`) | Cardinalidad por trimestre |
|---|---|
| `PARCIAL` | Múltiples → se promedian |
| `APRECIACION` | Múltiples → se promedian |
| `EXAMEN_TRIMESTRAL` | Solo 1 (backend rechaza duplicado con error 409) |

**Fórmula:**
```
promedioParciales   = avg(notas tipo PARCIAL del trimestre)
promedioApreciacion = avg(notas tipo APRECIACION del trimestre)
notaTrimestral      = (promedioParciales + promedioApreciacion + examenTrimestral) / 3
promedioFinal       = avg(notaT1, notaT2, notaT3)   // solo si los 3 trimestres están completos
```

Si falta cualquiera de los 3 componentes en un trimestre → `notaTrimestral = null` y se
muestra **"En curso"** en vez de un número.

⚠️ **Dato importante**: los registros viejos en la BD se migraron todos a `tipo='PARCIAL'`.
Por lo tanto, para estudiantes con datos antiguos, `notaTrimestral` será `null` hasta
que el profesor registre un Examen Trimestral y una Apreciación.

---

## 3. Contrato de la API (lo que cambia)

### POST `/notas/` y PUT `/notas/`

Body acepta ahora:
```json
{
  "estudiante_id": 2,
  "materia_id": 1,
  "tipo": "PARCIAL",
  "tipo_actividad": "Quiz",
  "nombre": "Quiz #1",
  "puntaje": 4.5,
  "trimestre": "I Trimestre",
  "comentario": "..."
}
```
- `tipo`: obligatorio, debe ser `PARCIAL` | `EXAMEN_TRIMESTRAL` | `APRECIACION`
- `tipo_actividad`: opcional
- `nombre`: opcional

**Errores nuevos a manejar en el frontend:**
- `400` "Tipo de evaluación no válido"
- `400` "Tipo de actividad no válido"
- `409` "Ya existe un Examen Trimestral registrado para este estudiante en este trimestre" (solo aplica a `EXAMEN_TRIMESTRAL`, en POST y PUT)

### GET `/notas/?resumen=1&estudiante_id=X&materia_id=Y` (NUEVO)

Devuelve los cálculos ya hechos por el backend — **no recalcular en frontend si se usa este endpoint**:
```json
{
  "I Trimestre": {
    "parciales": [ ... ],
    "promedio_parciales": 4.17,
    "apreciaciones": [ ... ],
    "promedio_apreciacion": 4.0,
    "examen_trimestral": 3.8,
    "nota_trimestral": 4.0
  },
  "II Trimestre": { ... },
  "III Trimestre": { ... },
  "promedio_final": null
}
```
Restricciones de permisos (el backend ya las valida):
- estudiante: solo su propio `estudiante_id`
- profesor: solo `materia_id` que le pertenezca
- admin: sin restricción

---

## 4. Tareas en `frontend/js/profesor.js`

### a) Select de tipo en el formulario de nota (`renderTrimestreContent`, `#newGradeType`)
Reemplazar opciones `parcial/taller/tarea` por:
```html
<option value="PARCIAL">Parcial (Quiz, Taller, Tarea...)</option>
<option value="EXAMEN_TRIMESTRAL">Examen Trimestral</option>
<option value="APRECIACION">Apreciación</option>
```

### b) Nuevos campos en el formulario
- Select opcional `#newGradeTipoActividad` con las 10 opciones de `tipo_actividad`
- Input de texto `#newGradeNombre` ("Nombre de la actividad")

### c) `addNewGrade()`
- Incluir `tipo_actividad` y `nombre` en el body del POST
- Si la respuesta es `409`, mostrar el mensaje de error del servidor (ya viene en `error.error`) — no es un error genérico, es informativo ("ya existe el examen de este trimestre")

### d) Función de cálculo
Reemplazar `getAverageForStudentTrimestre` por una que aplique la fórmula de 3 componentes
(sección 2). Debe devolver `null` si falta algún componente, en vez de un promedio simple.

### e) Resumen en el modal
Al final del trimestre activo en el modal de notas del estudiante, mostrar tabla resumen:

| Componente | Valor |
|---|---|
| Promedio Parciales | x.xx |
| Promedio Apreciación | x.xx |
| Examen Trimestral | x.xx |
| **Nota Trimestral** | x.xx / "En curso" |

### f) `normalizeGrade()`
Incluir `tipo_actividad` y `nombre` en el objeto normalizado.

### g) Advertencia de duplicado (opcional, UX)
Si el profesor ya registró un `EXAMEN_TRIMESTRAL` o `APRECIACION` para ese trimestre,
se puede deshabilitar/avisar en el select antes de enviar (el backend igual lo valida,
esto es solo para mejor UX).

---

## 5. Tareas en `frontend/js/estudiante.js`

### a) `normalizeGrade` (mapeo de datos)
Incluir `tipo_actividad` y `nombre`.

### b) `openGradesDetailModal`
Reorganizar — ya no agrupar por `type` genérico mostrando promedios independientes.
Mostrar:
- **Parciales**: lista de actividades + promedio
- **Apreciación**: lista de actividades + promedio
- **Examen Trimestral**: fila única (no se promedia)
- **Nota Trimestral**: calculada con la fórmula, al pie del bloque

### c) `getAverageForSubjectTrimestre` / `getGeneralAverage`
Reemplazar lógica actual por la fórmula de 3 componentes (sección 2).
- Promedio general (anual) = promedio de las 3 notas trimestrales, **solo si las 3 existen**
- Si falta algún trimestre → mostrar "En curso" en vez de un número

### d) `renderSubjectRow` / estado "Aprobado"/"En proceso"
El estado aprobado/en proceso debe basarse en `notaTrimestral` (o el promedio final
si aplica), no en el promedio simple anterior.

---

## 6. Qué NO se toca

- `frontend/js/admin.js`, `api.js`, `login.js`, `cambiar_password.js`, `configurar_preguntas.js`
- Todo el HTML y CSS (solo se agregan elementos nuevos a los formularios/modales existentes)
- `nota_auditoria` (sin cambios)

---

## 7. Casos de prueba sugeridos

1. Registrar 2 `PARCIAL` + 1 `APRECIACION` + 1 `EXAMEN_TRIMESTRAL` en I Trimestre → verificar `notaTrimestral`
2. Intentar registrar un segundo `EXAMEN_TRIMESTRAL` en el mismo trimestre → debe dar error 409
3. Trimestre incompleto (falta `APRECIACION`) → debe mostrar "En curso", no un número
4. Estudiante con datos antiguos (todo `PARCIAL`) → `notaTrimestral = null` hasta completar los 3 componentes
5. Verificar que `tipo_actividad` y `nombre` se guarden y se muestren correctamente
