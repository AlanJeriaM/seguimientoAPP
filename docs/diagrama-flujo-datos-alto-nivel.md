# Diagrama de Flujo de Datos de Alto Nivel - SeguimientoApp

## Descripción

Este diagrama muestra de forma **simple y visual** cómo fluyen los datos en el sistema de seguimiento de egresados, desde que un usuario ingresa hasta que obtiene información útil. Está diseñado para que cualquier persona (sin conocimientos técnicos) pueda entender cómo funciona la aplicación.

## Cómo exportar a imagen

1. Copia el código del bloque `mermaid`
2. Ve a https://mermaid.live/
3. Pégalo y exporta como SVG/PNG
4. **Para blanco y negro**: En Mermaid Live, cambia el tema a `base` o `neutral`

---

## Diagrama de Flujo de Datos

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#fff','primaryTextColor':'#000','primaryBorderColor':'#000','lineColor':'#000'}}}%%
flowchart TB
    %% Actores
    Egresado[👤 Egresado<br/>Usuario graduado]
    Admin[👔 Administrador<br/>Director/Jefe/Secretario]
    LinkedIn[🔗 LinkedIn<br/>Red profesional]

    %% Sistema Principal
    subgraph Sistema["📱 Sistema de Seguimiento de Egresados"]
        Login[🔐 Inicio de Sesión<br/>Email y contraseña]
        
        subgraph ZonaEgresado["Zona del Egresado"]
            PerfilE[📋 Mi Perfil<br/>Datos personales y profesionales]
            ExperienciaE[💼 Experiencias Laborales<br/>Historial de trabajos]
            HabilidadesE[🎯 Habilidades<br/>Tecnologías que domino]
            SyncLI[🔄 Sincronizar LinkedIn<br/>Importar datos automáticamente]
        end
        
        subgraph ZonaAdmin["Zona del Administrador"]
            ListaEgresados[📊 Lista de Egresados<br/>Ver todos los graduados]
            Reportes[📈 Reportes y Métricas<br/>Estadísticas e indicadores]
            Seguimientos[📝 Seguimientos<br/>Registro de contactos]
            Exportar[💾 Exportar Datos<br/>PDF y Excel]
        end
        
        BaseDatos[(🗄️ Base de Datos<br/>Almacenamiento seguro)]
    end

    %% Flujo del Egresado
    Egresado -->|1. Ingresa con sus credenciales| Login
    Login -->|2. Accede a su espacio| ZonaEgresado
    
    PerfilE -->|3. Actualiza información| BaseDatos
    ExperienciaE -->|4. Registra trabajos| BaseDatos
    HabilidadesE -->|5. Añade tecnologías| BaseDatos
    
    LinkedIn -->|6. Conecta y autoriza| SyncLI
    SyncLI -->|7. Importa datos automáticamente| PerfilE
    SyncLI -->|8. Actualiza experiencias| ExperienciaE
    SyncLI -->|9. Sincroniza habilidades| HabilidadesE

    %% Flujo del Administrador
    Admin -->|1. Ingresa con sus credenciales| Login
    Login -->|2. Accede al panel administrativo| ZonaAdmin
    
    BaseDatos -->|3. Lee información de egresados| ListaEgresados
    BaseDatos -->|4. Calcula estadísticas| Reportes
    
    Reportes -->|5. Genera análisis:<br/>- Tasa de empleo<br/>- Salarios promedio<br/>- Sectores laborales<br/>- Tecnologías más usadas| Exportar
    
    Admin -->|6. Registra contactos y notas| Seguimientos
    Seguimientos -->|7. Guarda historial| BaseDatos

    %% Estilos
    classDef actorStyle fill:#e1f5ff,stroke:#333,stroke-width:2px
    classDef sistemaStyle fill:#fff9e6,stroke:#333,stroke-width:2px
    classDef dbStyle fill:#ffe6e6,stroke:#333,stroke-width:2px
    
    class Egresado,Admin,LinkedIn actorStyle
    class Login,PerfilE,ExperienciaE,HabilidadesE,SyncLI,ListaEgresados,Reportes,Seguimientos,Exportar sistemaStyle
    class BaseDatos dbStyle
```

---

## Explicación Simple del Flujo de Datos

### 🎯 ¿Qué hace el sistema?

El sistema ayuda a **seguir la trayectoria profesional de los egresados** después de graduarse, permitiendo a la universidad:
- ✅ Saber dónde trabajan sus graduados
- ✅ Conocer qué tecnologías están usando en el mundo laboral
- ✅ Medir cuántos están empleados
- ✅ Generar reportes para mejorar los planes de estudio

---

### 👤 Flujo del Egresado (Usuario Graduado)

#### Paso 1: Ingreso al Sistema
El egresado entra con su **email y contraseña** al sistema.

#### Paso 2: Actualización de Perfil
Una vez dentro, puede:
- 📋 **Actualizar su información personal** (nombre, teléfono, email)
- 💼 **Registrar sus trabajos** (empresa, puesto, fechas)
- 🎯 **Listar sus habilidades** (lenguajes de programación, herramientas)

#### Paso 3: Sincronización con LinkedIn (Opcional)
Si el egresado tiene **LinkedIn**, puede:
- 🔗 **Conectar su cuenta** (una sola vez)
- 🔄 **Importar automáticamente** su información profesional
- ⚡ **Ahorrar tiempo** (no necesita escribir todo manualmente)

Los datos se **guardan de forma segura** en la base de datos del sistema.

---

### 👔 Flujo del Administrador (Director/Jefe/Secretario)

#### Paso 1: Ingreso al Sistema
El administrador entra con sus **credenciales especiales** al panel administrativo.

#### Paso 2: Consulta de Egresados
Puede ver:
- 📊 **Lista completa de egresados** con sus datos actualizados
- 🔍 **Buscar y filtrar** por carrera, año de egreso, etc.

#### Paso 3: Generación de Reportes
El sistema **calcula automáticamente** métricas importantes:
- 📈 **Tasa de empleabilidad**: ¿Cuántos están trabajando?
- 💰 **Salario promedio**: ¿Cuánto ganan?
- 🏢 **Sectores predominantes**: ¿En qué industrias trabajan?
- 💻 **Tecnologías más usadas**: ¿Qué herramientas demandan las empresas?

#### Paso 4: Registro de Seguimientos
El administrador puede:
- 📝 **Registrar contactos** con egresados (llamadas, emails, reuniones)
- 📋 **Agregar observaciones** sobre cada egresado
- 📅 **Llevar historial** de todas las interacciones

#### Paso 5: Exportación de Datos
Los reportes se pueden:
- 💾 **Exportar a PDF** (para presentaciones)
- 📊 **Exportar a Excel** (para análisis avanzados)

---

## 🔄 Ciclo Completo de los Datos

```
┌─────────────────────────────────────────────────────────────┐
│  1. Egresado actualiza su información (manual o LinkedIn)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Datos se guardan en la base de datos del sistema       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Sistema procesa y calcula métricas automáticamente     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Administrador visualiza reportes actualizados          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Universidad toma decisiones basadas en datos reales    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Seguridad y Privacidad

- 🔐 **Contraseñas encriptadas**: Nadie puede ver las contraseñas reales
- 🛡️ **Acceso por roles**: Cada usuario solo ve lo que le corresponde
- 🔑 **Tokens de LinkedIn**: Se guardan de forma segura y se renuevan automáticamente
- 📊 **Datos agregados**: Los reportes muestran estadísticas generales, no datos personales individuales

---

## 💡 Beneficios del Sistema

### Para el Egresado:
- ✅ Mantiene su perfil actualizado fácilmente
- ✅ Sincronización automática con LinkedIn
- ✅ Visibilidad ante la universidad

### Para la Universidad:
- ✅ Conoce el impacto real de sus programas
- ✅ Datos para acreditación y mejora continua
- ✅ Conexión permanente con egresados
- ✅ Reportes automáticos sin trabajo manual

### Para las Empresas:
- ✅ Conocen las competencias reales de los egresados
- ✅ Identifican candidatos potenciales
