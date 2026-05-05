# Modelo Conceptual - SeguimientoApp

## Descripción

Este modelo conceptual muestra las funcionalidades que desarrollan las entidades más importantes de la herramienta. También se muestra la relación que existe entre ellas, basado en los modelos del backend Django.

## Cómo exportar a imagen

1. Copia el código del bloque `mermaid`
2. Ve a https://mermaid.live/
3. Pégalo y exporta como SVG/PNG
4. **Para blanco y negro**: En Mermaid Live, cambia el tema a `base` o `neutral`

---

## Diagrama del Modelo Conceptual

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#fff','primaryTextColor':'#000','primaryBorderColor':'#000','lineColor':'#000'}}}%%
erDiagram
    Usuario ||--|| Egresado : "1:1 es"
    Usuario ||--|| Administrador : "1:1 es"
    Usuario {
        int id PK
        string username
        string email
        string password
        string rol
        datetime fecha_creacion
    }

    Egresado ||--|| PerfilProfesional : "1:1 tiene"
    Egresado ||--o{ Seguimiento : "1:N tiene"
    Egresado ||--o| IntegracionLinkedIn : "1:1 tiene"
    Egresado {
        int id PK
        int usuario_id FK
        string matricula
        string nombre
        string apellido_paterno
        string apellido_materno
        string carrera
        date fecha_egreso
        string email_institucional
        string telefono
        boolean activo
    }

    Administrador {
        int id PK
        int usuario_id FK
        string cargo
        string escuela
        string area_responsabilidad
    }

    PerfilProfesional ||--o{ ExperienciaLaboral : "1:N tiene"
    PerfilProfesional ||--o{ Habilidad : "1:N tiene"
    PerfilProfesional {
        int id PK
        int egresado_id FK
        string titulo_actual
        string empresa_actual
        string ubicacion
        string industria
        text resumen_profesional
        string linkedin_url
        datetime ultima_actualizacion
    }

    ExperienciaLaboral {
        int id PK
        int perfil_id FK
        string empresa
        string puesto
        date fecha_inicio
        date fecha_fin
        text descripcion
        string ubicacion
        boolean empleo_actual
        integer orden
    }

    Habilidad {
        int id PK
        int perfil_id FK
        string nombre
        string categoria
        integer nivel_dominio
        integer anos_experiencia
        boolean certificado
    }

    Seguimiento {
        int id PK
        int egresado_id FK
        int administrador_id FK
        date fecha
        string tipo
        string estado
        text observaciones
        text acciones_realizadas
    }

    IntegracionLinkedIn ||--|| PerfilProfesional : "1:1 sincroniza"
    IntegracionLinkedIn {
        int id PK
        int egresado_id FK
        string access_token
        datetime token_expiracion
        string linkedin_id
        datetime ultima_sincronizacion
        boolean activo
    }

    Administrador ||--o{ Reporte : "1:N genera"
    Administrador ||--o{ Seguimiento : "1:N realiza"
    Reporte ||--|| MetricaLaboral : "1:1 tiene"
    Reporte {
        int id PK
        int administrador_id FK
        datetime fecha_generacion
        string tipo_reporte
        date periodo_inicio
        date periodo_fin
        json datos_json
        string archivo_url
    }

    MetricaLaboral {
        int id PK
        int reporte_id FK
        float tasa_empleabilidad
        decimal salario_promedio
        string sector_predominante
        integer tiempo_promedio_empleo
        integer total_egresados_analizados
        datetime fecha_calculo
    }
```

## Entidades Principales y sus Funcionalidades

### Usuario
Entidad base para autenticación y autorización del sistema.

**Atributos:**
- id (PK)
- username
- email
- password (encriptado)
- rol (Administrador/Egresado)
- fecha_creacion

**Funcionalidades:**
- Iniciar sesión
- Cerrar sesión
- Recuperar contraseña
- Actualizar perfil básico
- Gestionar permisos según rol

---

### Egresado
Representa a los graduados de la institución educativa.

**Atributos:**
- id (PK)
- usuario_id (FK)
- matricula (único)
- nombre, apellido_paterno, apellido_materno
- carrera
- fecha_egreso
- email_institucional
- telefono
- activo

**Funcionalidades:**
- Gestionar perfil profesional
- Actualizar información de contacto
- Registrar experiencias laborales
- Agregar habilidades técnicas
- Sincronizar datos con LinkedIn
- Ver historial de seguimientos

---

### Administrador
Usuario con privilegios administrativos (Director, Jefe de Carrera, Secretario).

**Atributos:**
- id (PK)
- usuario_id (FK)
- cargo
- escuela
- area_responsabilidad

**Funcionalidades:**
- Visualizar reportes y métricas
- Generar análisis estadísticos
- Gestionar egresados
- Realizar seguimientos
- Exportar datos (PDF/Excel)
- Consultar dashboard administrativo

---

### PerfilProfesional
Información profesional actual del egresado.

**Atributos:**
- id (PK)
- egresado_id (FK)
- titulo_actual
- empresa_actual
- ubicacion
- industria
- resumen_profesional
- linkedin_url
- ultima_actualizacion

**Funcionalidades:**
- Actualizar información profesional
- Importar datos desde LinkedIn
- Gestionar visibilidad de perfil
- Validar datos actualizados

---

### ExperienciaLaboral
Historial de empleos y experiencia del egresado.

**Atributos:**
- id (PK)
- perfil_id (FK)
- empresa
- puesto
- fecha_inicio, fecha_fin
- descripcion
- ubicacion
- empleo_actual (boolean)
- orden

**Funcionalidades:**
- Agregar nueva experiencia
- Editar experiencia existente
- Eliminar experiencia
- Marcar como empleo actual
- Ordenar cronológicamente

---

### Habilidad
Competencias técnicas y tecnologías dominadas.

**Atributos:**
- id (PK)
- perfil_id (FK)
- nombre
- categoria
- nivel_dominio (1-5)
- anos_experiencia
- certificado (boolean)

**Funcionalidades:**
- Agregar habilidad
- Actualizar nivel de dominio
- Indicar certificaciones
- Categorizar por tipo

---

### Seguimiento
Registro de interacciones y seguimiento del egresado.

**Atributos:**
- id (PK)
- egresado_id (FK)
- administrador_id (FK)
- fecha
- tipo (contacto/encuesta/entrevista)
- estado
- observaciones
- acciones_realizadas

**Funcionalidades:**
- Crear registro de seguimiento
- Actualizar estado
- Agregar observaciones
- Historial completo por egresado

---

### IntegracionLinkedIn
Gestión de conexión OAuth con LinkedIn.

**Atributos:**
- id (PK)
- egresado_id (FK)
- access_token (encriptado)
- token_expiracion
- linkedin_id
- ultima_sincronizacion
- activo

**Funcionalidades:**
- Autenticar con OAuth 2.0
- Renovar token de acceso
- Obtener datos de perfil
- Sincronizar experiencias
- Sincronizar habilidades
- Desconectar cuenta

---

### Reporte
Documentos y análisis generados por administradores.

**Atributos:**
- id (PK)
- administrador_id (FK)
- fecha_generacion
- tipo_reporte
- periodo_inicio, periodo_fin
- datos_json
- archivo_url

**Funcionalidades:**
- Generar reporte personalizado
- Exportar a PDF
- Exportar a Excel
- Filtrar por período
- Visualizar historial de reportes

---

### MetricaLaboral
Indicadores estadísticos calculados.

**Atributos:**
- id (PK)
- reporte_id (FK)
- tasa_empleabilidad (%)
- salario_promedio
- sector_predominante
- tiempo_promedio_empleo (meses)
- total_egresados_analizados
- fecha_calculo

**Funcionalidades:**
- Calcular empleabilidad
- Analizar distribución salarial
- Identificar sectores principales
- Calcular tiempo promedio de inserción laboral
- Generar tendencias temporales
- Comparar por cohorte/carrera

---

## Relaciones Principales

- **Usuario → Egresado** (1:1): Un usuario puede ser un egresado
- **Usuario → Administrador** (1:1): Un usuario puede ser un administrador
- **Egresado → PerfilProfesional** (1:1 tiene): Cada egresado tiene un perfil profesional
- **Egresado → Seguimiento** (1:N tiene): Un egresado puede tener múltiples seguimientos
- **Egresado → IntegracionLinkedIn** (1:1 tiene): Un egresado puede tener una integración con LinkedIn
- **PerfilProfesional → ExperienciaLaboral** (1:N tiene): Un perfil contiene múltiples experiencias laborales
- **PerfilProfesional → Habilidad** (1:N tiene): Un perfil contiene múltiples habilidades
- **IntegracionLinkedIn → PerfilProfesional** (1:1 sincroniza): La integración sincroniza con el perfil
- **Administrador → Reporte** (1:N genera): Un administrador genera múltiples reportes
- **Administrador → Seguimiento** (1:N realiza): Un administrador realiza múltiples seguimientos
- **Reporte → MetricaLaboral** (1:1 tiene): Cada reporte tiene una métrica laboral asociada
