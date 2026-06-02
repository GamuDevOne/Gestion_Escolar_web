# Documentación Backend — Sistema de Gestión Escolar
**Versión:** 1.0  
**Stack:** PHP 8.2 · MariaDB 10.4 · XAMPP  
**Fecha:** Junio 2026

---

## Índice
1. [Estructura del Proyecto](#1-estructura-del-proyecto)
2. [Base de Datos](#2-base-de-datos)
3. [Autenticación](#3-autenticación)
4. [Endpoints de la API](#4-endpoints-de-la-api)
5. [Roles y Permisos](#5-roles-y-permisos)
6. [Formato de Respuestas](#6-formato-de-respuestas)
7. [Paginación y Búsqueda](#7-paginación-y-búsqueda)
8. [Frontend — Helper de API](#8-frontend--helper-de-api)
9. [Credenciales Iniciales](#9-credenciales-iniciales)
10. [Pendiente](#10-pendiente)

---

## 1. Estructura del Proyecto

```
gestion_escolar/
├── api/
│   ├── config/
│   │   ├── db.php                  # Conexión PDO + CORS + manejador de excepciones
│   │   ├── auth_middleware.php     # Validación de token Bearer
│   │   └── response.php           # Helpers: sendSuccess(), sendError(), sendCreated(), validateRequired()
│   ├── auth/
│   │   ├── login.php               # POST — Inicio de sesión
│   │   └── logout.php              # POST — Cierre de sesión
│   ├── estudiantes/
│   │   ├── index.php               # GET · POST · PUT
│   │   └── delete.php              # DELETE
│   ├── profesores/
│   │   ├── index.php               # GET · POST · PUT
│   │   └── delete.php              # DELETE
│   ├── materias/
│   │   ├── index.php               # GET · POST · PUT
│   │   └── delete.php              # DELETE
│   ├── matriculas/
│   │   └── index.php               # GET · POST · DELETE
│   ├── notas/
│   │   └── index.php               # GET · POST · PUT · DELETE
│   └── comentarios/
│       └── index.php               # GET · POST
└── frontend/
    ├── js/
    │   ├── api.js                  # Helper fetch autenticado (compartido)
    │   ├── login.js
    │   ├── admin.js
    │   ├── profesor.js
    │   └── estudiante.js
    ├── css/
    │   ├── login.css
    │   ├── admin.css
    │   ├── profesor.css
    │   └── estudiante.css
    ├── index.html                  # Login
    ├── admin.html
    ├── profesor.html
    └── estudiante.html
```

---

## 2. Base de Datos

**Nombre:** `gestion_escolar`  
**Motor:** InnoDB · Charset: utf8mb4

### Tablas

#### `usuario`
| Campo | Tipo | Descripción |
|---|---|---|
| id | INT PK AUTO | Identificador |
| email | VARCHAR(100) UNIQUE | Correo de acceso |
| password_hash | VARCHAR(255) | bcrypt (cost 12) |
| rol | ENUM('admin','profesor','estudiante') | Rol del usuario |
| nombre | VARCHAR(100) | Nombre completo |
| id_referencia | INT NULL | FK a `estudiante.id` o `profesor.id` (NULL para admin) |

#### `sesion`
| Campo | Tipo | Descripción |
|---|---|---|
| id | INT PK AUTO | Identificador |
| usuario_id | INT FK | Referencia a `usuario` |
| token | VARCHAR(64) UNIQUE | Token Bearer (hex 32 bytes) |
| expires_at | DATETIME | Expiración (8 horas desde login) |
| activa | TINYINT(1) | 1 = activa, 0 = cerrada |
| created_at | DATETIME | Fecha de creación |

#### `estudiante`
| Campo | Tipo | Descripción |
|---|---|---|
| id | INT PK AUTO | Identificador |
| nombre | VARCHAR(100) | Nombre completo |
| email | VARCHAR(100) UNIQUE | Correo |
| identificacion | VARCHAR(20) UNIQUE | Cédula o código |
| grado | VARCHAR(10) NULL | Ej: 10°, 11° |
| seccion | VARCHAR(10) NULL | Ej: A, B |

#### `profesor`
| Campo | Tipo | Descripción |
|---|---|---|
| id | INT PK AUTO | Identificador |
| nombre | VARCHAR(100) | Nombre completo |
| email | VARCHAR(100) UNIQUE | Correo |
| identificacion | VARCHAR(20) UNIQUE | Cédula |
| especialidad | VARCHAR(100) NULL | Área académica |

#### `materia`
| Campo | Tipo | Descripción |
|---|---|---|
| id | INT PK AUTO | Identificador |
| codigo | VARCHAR(20) UNIQUE | Código único Ej: MAT101 |
| nombre | VARCHAR(100) | Nombre de la materia |
| creditos | INT | Número de créditos (default 3) |
| profesor_id | INT FK NULL | Profesor asignado |

#### `matricula`
| Campo | Tipo | Descripción |
|---|---|---|
| id | INT PK AUTO | Identificador |
| estudiante_id | INT FK | Referencia a `estudiante` |
| materia_id | INT FK | Referencia a `materia` |
| fecha_asignacion | DATE | Fecha de matrícula |

> Restricción única: `(estudiante_id, materia_id)` — un estudiante no puede matricularse dos veces en la misma materia.

#### `nota`
| Campo | Tipo | Descripción |
|---|---|---|
| id | INT PK AUTO | Identificador |
| estudiante_id | INT FK | Referencia a `estudiante` |
| materia_id | INT FK | Referencia a `materia` |
| profesor_id | INT FK | Referencia a `profesor` |
| tipo | ENUM('parcial','taller','tarea') | Tipo de evaluación |
| puntaje | DECIMAL(3,1) | Rango: 1.0 – 5.0 |
| trimestre | ENUM('I Trimestre','II Trimestre','III Trimestre') | Período |
| comentario | VARCHAR(255) NULL | Observación opcional |
| fecha_registro | DATETIME | Fecha de registro |

#### `nota_auditoria`
| Campo | Tipo | Descripción |
|---|---|---|
| id | INT PK AUTO | Identificador |
| nota_id | INT FK | Nota modificada |
| editor_id | INT FK | Profesor que editó |
| puntaje_anterior | DECIMAL(3,1) | Valor previo |
| puntaje_nuevo | DECIMAL(3,1) | Valor nuevo |
| fecha_cambio | DATETIME | Fecha del cambio |

#### `comentario`
| Campo | Tipo | Descripción |
|---|---|---|
| id | INT PK AUTO | Identificador |
| estudiante_id | INT FK | Referencia a `estudiante` |
| materia_id | INT FK | Referencia a `materia` |
| comentario | TEXT | Contenido del comentario |
| fecha | DATETIME | Fecha de envío |

---

## 3. Autenticación

El sistema usa **tokens Bearer** con sesiones almacenadas en la tabla `sesion`.

### Flujo de login

```
POST /api/auth/login.php
Body: { "email": "...", "password": "..." }
```

1. Busca el usuario por email.
2. Verifica la contraseña:
   - Intenta con `password_verify()` (bcrypt).
   - Si falla, intenta con `SHA256` (legado) y migra automáticamente a bcrypt.
3. Invalida sesiones previas del mismo usuario.
4. Genera token con `bin2hex(random_bytes(32))`.
5. Registra la sesión con expiración de 8 horas.
6. Devuelve el token y datos del usuario.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "token": "abc123...",
    "rol": "admin",
    "nombre": "Administrador",
    "id_referencia": null
  }
}
```

### Flujo de logout

```
POST /api/auth/logout.php
Header: Authorization: Bearer <token>
```

Marca la sesión como inactiva (`activa = 0`).

### Protección de endpoints

Todos los endpoints (excepto login) incluyen al inicio:

```php
require '../config/db.php';
require '../config/auth_middleware.php';
```

`auth_middleware.php` extrae el token del header `Authorization: Bearer <token>`, lo valida contra la tabla `sesion` (activa = 1 y no expirada), y deja disponible la variable global `$authUser` con los datos del usuario autenticado.

---

## 4. Endpoints de la API

**URL base:** `http://localhost/gestion_escolar/api`

---

### Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/auth/login.php` | Iniciar sesión |
| POST | `/auth/logout.php` | Cerrar sesión |

---

### Estudiantes

| Método | Endpoint | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/estudiantes/` | admin | Listar estudiantes (paginado) |
| POST | `/estudiantes/` | admin | Crear estudiante + cuenta de usuario |
| PUT | `/estudiantes/` | admin | Editar estudiante |
| DELETE | `/estudiantes/delete.php` | admin | Eliminar estudiante |

**GET — Parámetros de query:**
```
?page=1&per_page=10&search=juan
```

**POST — Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@correo.com",
  "identificacion": "12345678",
  "grade": "10°",
  "seccion": "A"
}
```
> Al crear un estudiante se genera automáticamente su cuenta en `usuario` con contraseña inicial = número de identificación.

**DELETE — Body:**
```json
{ "id": 5 }
```
> No se puede eliminar si el estudiante tiene notas registradas.

---

### Profesores

| Método | Endpoint | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/profesores/` | admin | Listar profesores (paginado) |
| POST | `/profesores/` | admin | Crear profesor + cuenta de usuario |
| PUT | `/profesores/` | admin | Editar profesor |
| DELETE | `/profesores/delete.php` | admin | Eliminar profesor |

**GET — Parámetros de query:**
```
?page=1&per_page=10&search=maria
```

**POST — Body:**
```json
{
  "name": "María López",
  "email": "maria@correo.com",
  "identificacion": "87654321",
  "specialty": "Matemáticas"
}
```
> Al crear un profesor se genera automáticamente su cuenta con contraseña inicial = número de identificación.

---

### Materias

| Método | Endpoint | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/materias/` | admin, profesor, estudiante | Listar materias |
| POST | `/materias/` | admin | Crear materia |
| PUT | `/materias/` | admin | Editar materia |
| DELETE | `/materias/delete.php` | admin | Eliminar materia |

> Para admin devuelve paginado con `?page&per_page&search`. Para profesor y estudiante devuelve todas sin paginar.

**POST — Body:**
```json
{
  "name": "Ciencias Naturales",
  "code": "CN01",
  "credits": 3,
  "teacherId": 2
}
```

---

### Matrículas

| Método | Endpoint | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/matriculas/` | admin, profesor, estudiante | Listar matrículas |
| POST | `/matriculas/` | admin | Asignar materia a estudiante |
| DELETE | `/matriculas/` | admin | Eliminar matrícula |

> El servidor filtra automáticamente según el rol: estudiante ve solo las suyas, profesor ve las de sus materias, admin ve todas.

**POST — Body:**
```json
{ "studentId": 3, "subjectId": 1 }
```

---

### Notas

| Método | Endpoint | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/notas/` | admin, profesor, estudiante | Listar notas |
| POST | `/notas/` | profesor | Registrar nota |
| PUT | `/notas/` | profesor | Editar nota (genera auditoría) |
| DELETE | `/notas/` | profesor | Eliminar nota propia |

> El `profesor_id` se extrae del token, nunca del body. Un profesor solo puede ver, editar y eliminar sus propias notas.

**GET — Filtros opcionales:**
```
?materia_id=1&estudiante_id=3&trimestre=I Trimestre
```

**POST — Body:**
```json
{
  "estudiante_id": 3,
  "materia_id": 1,
  "tipo": "parcial",
  "puntaje": 4.5,
  "trimestre": "I Trimestre",
  "comentario": "Excelente presentación"
}
```

**Valores válidos:**
- `tipo`: `parcial` · `taller` · `tarea`
- `puntaje`: 1.0 – 5.0
- `trimestre`: `I Trimestre` · `II Trimestre` · `III Trimestre`

---

### Comentarios

| Método | Endpoint | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/comentarios/` | admin, profesor, estudiante | Listar comentarios |
| POST | `/comentarios/` | estudiante | Enviar comentario |

> Estudiante solo puede comentar materias en las que está matriculado. Profesor ve solo comentarios de sus materias. Admin ve todos.

**POST — Body:**
```json
{ "materia_id": 1, "comentario": "La clase estuvo muy bien explicada." }
```

---

## 5. Roles y Permisos

| Acción | Admin | Profesor | Estudiante |
|---|:---:|:---:|:---:|
| Ver/gestionar estudiantes | ✅ | ❌ | ❌ |
| Ver/gestionar profesores | ✅ | ❌ | ❌ |
| Ver/gestionar materias | ✅ | 👁️ | 👁️ |
| Gestionar matrículas | ✅ | ❌ | ❌ |
| Ver matrículas propias | ❌ | 👁️ | 👁️ |
| Registrar/editar/eliminar notas | ❌ | ✅ | ❌ |
| Ver notas propias | ❌ | ❌ | 👁️ |
| Enviar comentarios | ❌ | ❌ | ✅ |
| Ver comentarios de sus materias | ❌ | 👁️ | ❌ |
| Ver todos los comentarios | ✅ | ❌ | ❌ |

---

## 6. Formato de Respuestas

Todos los endpoints usan el mismo formato gracias a `response.php`.

### Éxito (200)
```json
{
  "success": true,
  "data": { }
}
```

### Creación exitosa (201)
```json
{
  "success": true,
  "data": { "id": 5, "message": "Recurso creado" }
}
```

### Error
```json
{
  "success": false,
  "error": "Descripción del error",
  "code": 400
}
```

### Error con detalle (validación)
```json
{
  "success": false,
  "error": "Campos obligatorios faltantes",
  "code": 400,
  "details": { "campos": ["name", "email"] }
}
```

### Códigos de estado usados

| Código | Significado |
|---|---|
| 200 | Éxito |
| 201 | Creado correctamente |
| 400 | Datos inválidos o faltantes |
| 401 | No autenticado / token inválido |
| 403 | Sin permisos para esta acción |
| 404 | Recurso no encontrado |
| 405 | Método HTTP no permitido |
| 409 | Conflicto (duplicado, restricción) |
| 500 | Error interno del servidor |

---

## 7. Paginación y Búsqueda

Los endpoints que soportan paginación (estudiantes, profesores, materias, matrículas para admin) aceptan estos parámetros:

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| page | int | 1 | Página actual |
| per_page | int | 10 | Registros por página (máx. 100) |
| search | string | "" | Búsqueda por LIKE en campos relevantes |

**Respuesta paginada:**
```json
{
  "success": true,
  "data": {
    "items": [ ],
    "total": 45,
    "page": 2,
    "per_page": 10,
    "total_pages": 5
  }
}
```

**Campos en los que busca cada endpoint:**

| Endpoint | Campos de búsqueda |
|---|---|
| `/estudiantes/` | nombre, email, identificacion |
| `/profesores/` | nombre, email, especialidad |
| `/materias/` | nombre, codigo |
| `/matriculas/` | nombre del estudiante, nombre de la materia |

---

## 8. Frontend — Helper de API

Todos los archivos HTML cargan `api.js` antes de su JS propio:

```html
<script src="js/api.js"></script>
<script src="js/[modulo].js"></script>
```

### `apiFetch(endpoint, options)`

Wrapper de `fetch` que inyecta automáticamente el token Bearer.

```javascript
// GET
const res  = await apiFetch('/estudiantes/?page=1&per_page=10');
const json = await res.json();
const data = json.data ?? json;

// POST
const res = await apiFetch('/notas/', {
    method: 'POST',
    body: JSON.stringify({ ... })
});

// DELETE
const res = await apiFetch('/materias/delete.php', {
    method: 'DELETE',
    body: JSON.stringify({ id: 3 })
});
```

**Comportamiento automático:**
- Si el servidor responde `401` → limpia localStorage y redirige al login.
- Si el servidor responde `403` → lanza un `Error` con el mensaje del servidor.

### Sesión en localStorage

Al hacer login se guarda:
```javascript
{
  email:         "admin@escuela.edu",
  token:         "abc123...",
  rol:           "admin",
  nombre:        "Administrador",
  id_referencia: null
}
```

---

## 9. Credenciales Iniciales

| Usuario | Email | Contraseña inicial |
|---|---|---|
| Administrador | `admin@escuela.edu` | `admin123` |
| Profesor nuevo | email registrado | número de identificación |
| Estudiante nuevo | email registrado | número de identificación |

> La primera vez que un usuario con contraseña SHA256 inicia sesión, el sistema migra automáticamente su hash a bcrypt.

---

## 10. Pendiente

Las siguientes funcionalidades están diseñadas y planificadas pero aún no implementadas:

| Funcionalidad | Descripción |
|---|---|
| **Panel de períodos** | Tabla `periodo` + endpoints para abrir/cerrar trimestres. El profesor solo podrá registrar notas en el período activo. |
| **Cambio de contraseña** | Endpoint `PUT /auth/cambiar_password.php` para que cada usuario cambie su propia contraseña. |
| **Formularios actualizados** | Campos de cédula/identificación visibles en los formularios de admin (pendiente de diseño). |

---

*Documentación generada para uso interno del equipo de desarrollo.*
