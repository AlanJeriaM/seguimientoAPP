# Diagrama de Clases - SeguimientoApp

## Descripción

Este diagrama muestra la estructura de clases del sistema de seguimiento de egresados, incluyendo las entidades principales, sus atributos, métodos y relaciones.

## Cómo exportar a imagen

1. Copia el código del bloque `mermaid`
2. Ve a https://mermaid.live/
3. Pégalo y exporta como SVG/PNG

---

## Diagrama de Clases

```mermaid
classDiagram
    %% Entidades principales
    class Usuario {
        +int id
        +string email
        +string password
        +string nombre
        +string apellidos
        +string telefono
        +date fechaRegistro
        +string rol
        +boolean activo
        +login()
        +logout()
        +actualizarPerfil()
        +cambiarPassword()
    }

    class Egresado {
        +int id
        +int usuarioId
        +string carrera
        +int anioEgreso
        +string numeroControl
        +string linkedinUrl
        +string linkedinAccessToken
        +date tokenExpiration
        +boolean empleado
        +float salarioActual
        +string sectorLaboral
        +sincronizarLinkedIn()
        +actualizarEstadoLaboral()
        +obtenerMetricas()
    }

    class Administrador {
        +int id
        +int usuarioId
        +string departamento
        +string nivelAcceso
        +date fechaAsignacion
        +generarReportes()
        +gestionarEgresados()
        +exportarDatos()
    }

    class ExperienciaLaboral {
        +int id
        +int egresadoId
        +string empresa
        +string puesto
        +string descripcion
        +date fechaInicio
        +date fechaFin
        +boolean actualmenteEmpleado
        +string ubicacion
        +string tipoEmpleo
        +calcularDuracion()
        +validarFechas()
    }

    class Habilidad {
        +int id
        +string nombre
        +string categoria
        +string nivel
        +string descripcion
    }

    class EgresadoHabilidad {
        +int id
        +int egresadoId
        +int habilidadId
        +int nivelDominio
        +int aniosExperiencia
        +date fechaAdquisicion
        +string fuenteVerificacion
    }

    class Encuesta {
        +int id
        +string titulo
        +string descripcion
        +string tipo
        +date fechaCreacion
        +date fechaInicio
        +date fechaFin
        +boolean activa
        +int creadorId
        +crearEncuesta()
        +activarEncuesta()
        +desactivarEncuesta()
        +obtenerResultados()
    }

    class Pregunta {
        +int id
        +int encuestaId
        +string textoPregunta
        +string tipoPregunta
        +boolean obligatoria
        +int orden
        +string opciones
        +validarRespuesta()
    }

    class SesionEncuesta {
        +int id
        +int encuestaId
        +int egresadoId
        +date fechaInicio
        +date fechaCompletado
        +string estado
        +float progreso
        +iniciarSesion()
        +guardarProgreso()
        +completarEncuesta()
    }

    class Respuesta {
        +int id
        +int sesionEncuestaId
        +int preguntaId
        +string valorRespuesta
        +date fechaRespuesta
        +guardarRespuesta()
        +validarRespuesta()
    }

    class Seguimiento {
        +int id
        +int egresadoId
        +int adminId
        +date fechaContacto
        +string tipoContacto
        +string medio
        +string observaciones
        +string resultado
        +registrarContacto()
        +actualizarObservaciones()
    }

    class Reporte {
        +int id
        +string tipoReporte
        +date fechaGeneracion
        +int generadoPor
        +string parametros
        +string formatoExportacion
        +Object datosReporte
        +generarReporte()
        +exportarPDF()
        +exportarExcel()
        +calcularMetricas()
    }

    class Notificacion {
        +int id
        +int usuarioId
        +string tipo
        +string titulo
        +string mensaje
        +date fechaCreacion
        +boolean leida
        +enviarNotificacion()
        +marcarComoLeida()
    }

    %% Relaciones 1:1 (Herencia)
    Usuario "1" --|> "1" Egresado : hereda
    Usuario "1" --|> "1" Administrador : hereda

    %% Relaciones 1:N
    Egresado "1" --o "N" ExperienciaLaboral : posee
    Egresado "1" --o "N" SesionEncuesta : realiza
    Egresado "1" --o "N" Seguimiento : recibe
    Administrador "1" --o "N" Seguimiento : gestiona
    Administrador "1" --o "N" Reporte : crea
    Administrador "1" --o "N" Encuesta : diseña
    Encuesta "1" *-- "N" Pregunta : contiene
    Encuesta "1" --o "N" SesionEncuesta : instancia
    SesionEncuesta "1" *-- "N" Respuesta : agrupa
    Pregunta "1" --o "N" Respuesta : obtiene
    Usuario "1" --o "N" Notificacion : recibe

    %% Relaciones N:M (con tabla intermedia)
    Egresado "N" --> "M" Habilidad : domina
    Egresado "1" --o "N" EgresadoHabilidad : registra
    Habilidad "1" --o "N" EgresadoHabilidad : vincula

    %% Estilos
    class Usuario {
        <<Entity>>
    }
    class Egresado {
        <<Entity>>
    }
    class Administrador {
        <<Entity>>
    }
    class ExperienciaLaboral {
        <<Entity>>
    }
    class Habilidad {
        <<Entity>>
    }
    class EgresadoHabilidad {
        <<Entity>>
    }
    class Encuesta {
        <<Entity>>
    }
    class Pregunta {
        <<Entity>>
    }
    class SesionEncuesta {
        <<Entity>>
    }
    class Respuesta {
        <<Entity>>
    }
    class Seguimiento {
        <<Entity>>
    }
    class Reporte {
        <<Entity>>
    }
    class Notificacion {
        <<Entity>>
    }
```

---

## Descripción de las Clases

### 👤 Clases de Usuario

#### Usuario
Clase base que representa a cualquier usuario del sistema (egresado o administrador).
- **Atributos principales:** Datos de identificación y autenticación
- **Métodos clave:** Login, logout, gestión de perfil

#### Egresado
Especialización de Usuario que representa a un graduado del programa.
- **Atributos principales:** Información académica, laboral y de LinkedIn
- **Métodos clave:** Sincronización con LinkedIn, actualización de estado

#### Administrador
Especialización de Usuario con privilegios administrativos.
- **Atributos principales:** Departamento, nivel de acceso
- **Métodos clave:** Generación de reportes, gestión de egresados

---

### 💼 Clases de Información Profesional

#### ExperienciaLaboral
Registra el historial laboral de cada egresado.
- **Relación:** Cada egresado puede tener múltiples experiencias

#### Habilidad
Catálogo de habilidades técnicas y profesionales.
- **Relación:** Múltiples egresados pueden tener las mismas habilidades

#### EgresadoHabilidad
Tabla intermedia que vincula egresados con habilidades.
- **Atributos adicionales:** Nivel de dominio, años de experiencia

---

### 📋 Clases de Encuestas

#### Encuesta
Define las encuestas de seguimiento a egresados.
- **Atributos principales:** Título, descripción, fechas de vigencia
- **Métodos clave:** Activación, desactivación, obtención de resultados

#### Pregunta
Preguntas individuales dentro de una encuesta.
- **Atributos principales:** Texto, tipo (abierta/cerrada/múltiple), obligatoriedad

#### SesionEncuesta
Instancia de una encuesta respondida por un egresado.
- **Atributos principales:** Estado, progreso, fechas

#### Respuesta
Respuesta individual a una pregunta específica.
- **Relación:** Vincula sesión de encuesta con pregunta

---

### 📊 Clases de Gestión

#### Seguimiento
Registra los contactos entre administradores y egresados.
- **Atributos principales:** Tipo de contacto, medio, observaciones

#### Reporte
Almacena los reportes generados por el sistema.
- **Atributos principales:** Tipo, parámetros, datos calculados
- **Métodos clave:** Generación, exportación a PDF/Excel

#### Notificacion
Sistema de notificaciones para usuarios.
- **Atributos principales:** Tipo, mensaje, estado de lectura

---

## Relaciones Principales

### 🔹 Relaciones 1:1 (Uno a Uno) - Herencia
| Clase Padre | Clase Hija | Cardinalidad | Tipo | Descripción |
|-------------|------------|--------------|------|-------------|
| Usuario | Egresado | 1:1 | `--|>` Herencia | Un usuario puede ser un egresado |
| Usuario | Administrador | 1:1 | `--|>` Herencia | Un usuario puede ser un administrador |

**Notación:** `--|>` indica herencia (extends/inherits)

---

### 🔹 Relaciones 1:N (Uno a Muchos)

| Clase Origen | Clase Destino | Cardinalidad | Tipo | Descripción |
|--------------|---------------|--------------|------|-------------|
| Egresado | ExperienciaLaboral | 1:N | `--o` Agregación | Un egresado tiene múltiples experiencias laborales |
| Egresado | SesionEncuesta | 1:N | `--o` Agregación | Un egresado puede responder múltiples encuestas |
| Egresado | Seguimiento | 1:N | `--o` Agregación | Un egresado puede tener múltiples seguimientos |
| Administrador | Seguimiento | 1:N | `--o` Agregación | Un administrador realiza múltiples seguimientos |
| Administrador | Reporte | 1:N | `--o` Agregación | Un administrador genera múltiples reportes |
| Administrador | Encuesta | 1:N | `--o` Agregación | Un administrador crea múltiples encuestas |
| Encuesta | Pregunta | 1:N | `*--` Composición | Una encuesta contiene una o más preguntas |
| Encuesta | SesionEncuesta | 1:N | `--o` Agregación | Una encuesta genera múltiples sesiones |
| SesionEncuesta | Respuesta | 1:N | `*--` Composición | Una sesión contiene múltiples respuestas |
| Pregunta | Respuesta | 1:N | `--o` Agregación | Una pregunta recibe múltiples respuestas |
| Usuario | Notificacion | 1:N | `--o` Agregación | Un usuario recibe múltiples notificaciones |

**Notación:**
- `--o` indica agregación (puede existir independientemente)
- `*--` indica composición (no puede existir sin el contenedor)

---

### 🔹 Relaciones N:M (Muchos a Muchos)

| Clase A | Clase B | Cardinalidad | Tabla Intermedia | Tipo | Descripción |
|---------|---------|--------------|------------------|------|-------------|
| Egresado | Habilidad | N:M | EgresadoHabilidad | `-->` Asociación | Múltiples egresados pueden dominar múltiples habilidades |

**Implementación:**
- Se usa la tabla intermedia `EgresadoHabilidad`
- Permite almacenar atributos adicionales como `nivelDominio` y `aniosExperiencia`

---

## Cardinalidades Detalladas

### 📊 Tabla de Cardinalidades Completa

| Relación | Cardinalidad | Tipo | Lectura | Descripción |
|----------|--------------|------|---------|-------------|
| Usuario → Egresado | 1:1 | Herencia | Un usuario **es** un egresado | Relación de especialización |
| Usuario → Administrador | 1:1 | Herencia | Un usuario **es** un administrador | Relación de especialización |
| Egresado → ExperienciaLaboral | 1:N | Agregación | Un egresado **tiene** N experiencias | Historial laboral |
| Egresado → Habilidad | N:M | Asociación | N egresados **dominan** M habilidades | Competencias técnicas |
| Egresado → EgresadoHabilidad | 1:N | Agregación | Un egresado **registra** N vínculos | Tabla intermedia |
| Habilidad → EgresadoHabilidad | 1:N | Agregación | Una habilidad **vincula** N egresados | Tabla intermedia |
| Egresado → SesionEncuesta | 1:N | Agregación | Un egresado **responde** N encuestas | Historial de respuestas |
| Egresado → Seguimiento | 1:N | Agregación | Un egresado **recibe** N seguimientos | Historial de contactos |
| Administrador → Seguimiento | 1:N | Agregación | Un admin **realiza** N seguimientos | Gestión de contactos |
| Administrador → Reporte | 1:N | Agregación | Un admin **genera** N reportes | Análisis de datos |
| Administrador → Encuesta | 1:N | Agregación | Un admin **crea** N encuestas | Diseño de instrumentos |
| Encuesta → Pregunta | 1:N | Composición | Una encuesta **contiene** N preguntas | Estructura de encuesta |
| Encuesta → SesionEncuesta | 1:N | Agregación | Una encuesta **genera** N sesiones | Instancias de respuesta |
| SesionEncuesta → Respuesta | 1:N | Composición | Una sesión **agrupa** N respuestas | Respuestas individuales |
| Pregunta → Respuesta | 1:N | Agregación | Una pregunta **obtiene** N respuestas | Múltiples egresados responden |
| Usuario → Notificacion | 1:N | Agregación | Un usuario **recibe** N notificaciones | Sistema de alertas |

---

## Tipos de Relaciones Explicadas

### 🔺 Herencia (1:1) - `--|>`
```
Usuario --|> Egresado (1:1)
Usuario --|> Administrador (1:1)
```
- **Significado:** "es un tipo de"
- **Ejemplo:** Un Egresado **es un tipo de** Usuario
- **Características:** Hereda todos los atributos y métodos de Usuario
- **Cardinalidad:** Siempre 1:1

### 🔷 Composición (1:N) - `*--`
```
Encuesta *-- Pregunta (1:N)
SesionEncuesta *-- Respuesta (1:N)
```
- **Significado:** "contiene y controla el ciclo de vida"
- **Ejemplo:** Una Encuesta **contiene** N Preguntas
- **Características:** Si se elimina la encuesta, se eliminan sus preguntas
- **Cardinalidad:** 1:N (uno a muchos)

### 🔶 Agregación (1:N) - `--o`
```
Egresado --o ExperienciaLaboral (1:N)
Administrador --o Reporte (1:N)
```
- **Significado:** "tiene o posee"
- **Ejemplo:** Un Egresado **tiene** N Experiencias Laborales
- **Características:** Las experiencias pueden existir sin el egresado
- **Cardinalidad:** 1:N (uno a muchos)

### 🔹 Asociación (N:M) - `-->`
```
Egresado --> Habilidad (N:M)
```
- **Significado:** "está relacionado con"
- **Ejemplo:** N Egresados **están relacionados con** M Habilidades
- **Características:** Implementada con tabla intermedia (EgresadoHabilidad)
- **Cardinalidad:** N:M (muchos a muchos)

---

## Resumen de Cardinalidades

| Tipo de Relación | Notación | Cardinalidad | Ejemplo en el Sistema |
|------------------|----------|--------------|----------------------|
| **Herencia** | `--|>` | 1:1 | Usuario → Egresado |
| **Composición** | `*--` | 1:N | Encuesta → Pregunta |
| **Agregación** | `--o` | 1:N | Egresado → ExperienciaLaboral |
| **Asociación** | `-->` | N:M | Egresado → Habilidad |

---

## Patrones de Diseño Aplicados

### 1. **Herencia (Inheritance)**
- `Usuario` como clase base para `Egresado` y `Administrador`
- Permite reutilización de código y polimorfismo

### 2. **Tabla de Asociación (Junction Table)**
- `EgresadoHabilidad` vincula `Egresado` con `Habilidad`
- Permite atributos adicionales en la relación

### 3. **Composición**
- `Encuesta` compone `Pregunta`
- Las preguntas no existen sin una encuesta

### 4. **Agregación**
- `SesionEncuesta` agrega `Respuesta`
- Las respuestas pertenecen a una sesión específica

---

## Consideraciones Técnicas

### Base de Datos
- Todas las clases se mapean a tablas en MySQL
- Las relaciones N:M utilizan tablas intermedias
- Uso de claves foráneas para integridad referencial

### Backend (Node.js + Express)
- Cada clase tiene un modelo correspondiente
- Controladores manejan la lógica de negocio
- Uso de Sequelize como ORM para mapeo objeto-relacional

### Frontend (Angular)
- Interfaces TypeScript reflejan las clases del backend
- Servicios para comunicación con la API REST
- Modelos de dominio para tipado fuerte
