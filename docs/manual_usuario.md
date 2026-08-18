# MANUAL DE USO DEL SISTEMA DE SEGUIMIENTO DE EGRESADOS

**Área de desarrollo — Trabajo de Título**  
*Versión orientada a usuarios administradores y egresados*

---

## B.1. Introducción

El objetivo de este manual es orientar a los distintos usuarios del sistema en el acceso y uso de las funcionalidades disponibles, describiendo los pasos necesarios tanto para ingresar a la plataforma como para operar cada módulo.

El **Sistema de Seguimiento de Egresados** (SeguimientoApp) es una aplicación web que permite:

- Registrar y mantener actualizada la información profesional de los egresados.
- Visualizar indicadores y reportes del mercado laboral tecnológico a partir de los datos consolidados.
- Diseñar, publicar y analizar encuestas dirigidas a la comunidad de egresados.
- Administrar cuentas de egresados y de personal con rol administrativo.

El sistema contempla dos perfiles de usuario:

| Perfil | Descripción |
|--------|-------------|
| **Egresado** | Graduado que ingresa con su cuenta de LinkedIn, completa su perfil profesional, responde encuestas y consulta reportes agregados. |
| **Administrador** | Usuario institucional que gestiona egresados, administradores, encuestas y accede al panel analítico completo. |

A continuación se detalla, en la primera sección, el **ingreso al sistema**; en las secciones **B.2** y **B.3**, el funcionamiento de los módulos según el rol del usuario.

> **Nota para la tesis:** Inserte capturas de pantalla reales de su despliegue (local o producción) y numéreelas como *Figura B.1*, *Figura B.2*, etc., siguiendo el estilo del manual de referencia (Gonzalo Madariaga, 2023).

---

## B.1.1. Ingreso al sistema

### Requisitos previos

1. Disponer de un navegador web actualizado (Chrome, Firefox, Edge o Safari).
2. Contar con conexión a Internet.
3. Conocer la URL de acceso al sistema (por ejemplo: `http://localhost:4200` en desarrollo o la URL definida en producción).

### Pantalla de autenticación

Para ingresar, el usuario debe abrir el navegador y dirigirse a la ruta de autenticación del sistema (`/auth`). Se mostrará la pantalla de inicio de sesión con dos modalidades, seleccionables mediante el botón superior **«Egresados»** / **«Administrador»** (ver *Figura B.1*).

**Figura B.1:** Pantalla de inicio de sesión con selector de rol.

---

### B.1.1.1. Ingreso del usuario egresado

El acceso del egresado al sistema se realiza mediante autenticación con **LinkedIn** y contempla, para un usuario nuevo, un flujo de **cuatro etapas**: ingreso a la aplicación, autorización en LinkedIn, completitud del perfil profesional y acceso al dashboard principal.

---

#### Paso 1: Ingreso a la página del sistema

El primer paso consiste en abrir un navegador web y dirigirse a la **URL de despliegue** de la aplicación (por ejemplo, `http://localhost:4200` en desarrollo, o la dirección institucional en producción). Al cargar el sitio, el sistema redirige automáticamente a la ruta `/auth`, donde se presenta la pantalla **Portal Egresados** (*Figura B.2*).

En esta pantalla, el usuario debe verificar que **no** esté activa la vista de *Panel Administrativo*. Si aparecen campos de correo y contraseña, debe presionar el botón superior **«Egresados»** para volver al modo correcto.

**Elementos visibles en el Paso 1:**

1. **Encabezado del portal:** título *Portal Egresados* y mensaje de bienvenida.
2. **Ícono de LinkedIn** con el texto *Conecta con tu perfil profesional*.
3. **Botón «Ingresar con LinkedIn»:** inicia la autenticación externa.
4. **Botón de cambio de rol** (parte superior): alterna entre egresado y administrador; debe permanecer en modo egresado.

**Figura B.2:** Paso 1 — Página de ingreso del egresado en la URL del sistema.

---

#### Paso 2: Redirección y autenticación en LinkedIn

Al presionar **«Ingresar con LinkedIn»**, el sistema solicita al servidor la URL de autorización y muestra un cuadro de diálogo con el mensaje *Conectando con LinkedIn* o *Redirigiendo a LinkedIn*. Luego, el navegador carga el sitio oficial de LinkedIn (`linkedin.com`), donde el usuario debe:

1. Iniciar sesión con su cuenta de LinkedIn (si no lo ha hecho en esa sesión).
2. Revisar los permisos solicitados por la aplicación.
3. Presionar **«Permitir»** o **«Aceptar»** para autorizar la vinculación.

Tras la autorización, LinkedIn redirige a la aplicación con un código de autenticación. El sistema lo procesa, **registra al usuario** si es su primer ingreso o actualiza sus datos si ya existía, muestra *Accediendo al portal...* y lo conduce al área privada `/user` (*Figura B.3*).

**Figura B.3:** Paso 2 — Pantalla de autorización en LinkedIn y retorno al sistema.

Si el usuario cancela o hay un error, el sistema permanece en el login y muestra un mensaje de error, permitiendo reintentar.

---

#### Paso 3: Completar el perfil profesional (usuario nuevo)

En el primer ingreso, el sistema importa desde LinkedIn nombre, fotografía, correo, empresa, cargo, ubicación y resumen. Para generar métricas del mercado laboral, exige completar **campos obligatorios** antes de habilitar el dashboard y las encuestas.

Si el perfil está incompleto, al intentar acceder a `/user/dashboard` el sistema redirige a `/user/mi-perfil` y muestra el aviso **«Complete su perfil profesional»** con una barra de progreso (*Figura B.4*).

**Campos obligatorios:**

1. Años de experiencia laboral  
2. Nivel de educación  
3. Especialidad técnica  
4. Tipo de empleo actual  
5. Disponibilidad para cambio de trabajo  
6. Área de interés  

El formulario incluye secciones de *Información personal*, *Información profesional* y *Datos para métricas*. El usuario debe completar los campos con asterisco (*), presionar **«Guardar cambios»** y verificar que el progreso alcance **100 %** (*¡Perfil completado exitosamente!*).

**Figura B.4:** Paso 3 — Completitud del perfil profesional para usuario nuevo.

Hasta completar el perfil, el dashboard y las encuestas permanecen bloqueados por el sistema.

---

#### Paso 4: Acceso al Dashboard principal

Con el perfil completo, el egresado accede al **Dashboard principal** desde el menú **Reporte egresados → Dashboard principal** o la ruta `/user/dashboard` (*Figura B.5*).

**Elementos principales del dashboard:**

1. **Encabezado personalizado:** foto de LinkedIn, nombre, cargo, ubicación, empresa e industria (clic en nombre/foto → Mi perfil).
2. **Tarjetas de resumen:** profesionales activos, satisfacción laboral, tecnologías y empleabilidad del sector.
3. **Gráficos interactivos:** salarios, tecnologías demandadas, experiencia, mapa de calor y métricas avanzadas.
4. **Botón de menú (☰):** panel lateral para encuestas y otras secciones.
5. **Botón volver arriba:** al desplazarse por gráficos extensos.

**Figura B.5:** Paso 4 — Dashboard principal del egresado tras completar el perfil.

A partir de aquí el egresado tiene acceso completo a reportes, encuestas y actualización de su perfil (ver sección B.3).

---

### B.1.1.2. Ingreso del usuario administrador

El panel administrativo utiliza **correo electrónico y contraseña** asignados por el responsable del sistema.

**Pasos:**

1. En la pantalla de login, presionar el botón **«Administrador»** para cambiar a la vista del panel administrativo.
2. Ingresar el **correo electrónico** institucional en el campo correspondiente.
3. Ingresar la **contraseña** y presionar **«Iniciar Sesión»**.
4. Si las credenciales son válidas, el sistema redirigirá al área administrativa (`/admin`).

**Figura B.3:** Formulario de acceso para administradores.

**Recuperación de contraseña (solo administradores):**

1. En la pantalla de login administrativo, seleccionar el enlace **«¿Olvidaste tu contraseña?»**.
2. Ingresar el correo registrado y solicitar el **código de verificación**.
3. Introducir el código recibido y definir una **nueva contraseña** siguiendo los pasos del asistente en pantalla.

**Figura B.4:** Asistente de restablecimiento de contraseña.

---

### B.1.2. Navegación general (ambos roles)

Una vez autenticado, la interfaz principal se compone de:

1. **Barra superior (toolbar):** muestra el título de la sección y opciones de sesión.
2. **Botón de menú (☰):** abre o cierra el panel lateral de navegación.
3. **Menú lateral (sidebar):** agrupa los módulos según el rol del usuario.
4. **Área de contenido:** muestra la pantalla activa (dashboard, tablas, formularios, etc.).

**Figura B.5:** Vista general con menú lateral desplegado.

**Elementos del menú lateral:**

1. **Tarjeta de perfil:** al hacer clic, accede a **Mi perfil** (`/admin/mi-perfil` o `/user/mi-perfil`).
2. **Opciones del menú:** dependen del rol (detalladas en B.2 y B.3).
3. **Botón cerrar (×):** oculta el menú en dispositivos móviles o pantallas pequeñas.

Para cerrar sesión, utilice la opción correspondiente en la barra superior del sistema.

---

## B.2. Módulos del sistema — Usuario administrador

Esta sección describe las funcionalidades disponibles para usuarios con rol **administrador**.

### B.2.1. Dashboard y reporte de egresados

**Acceso:** Menú lateral → **Reporte egresados** → **Dashboard principal**, o ruta `/admin/dashboard`.

El dashboard presenta métricas agregadas del mercado laboral tecnológico basadas en los perfiles de egresados registrados. Entre los elementos principales se encuentran:

1. **Encabezado de mercado:** indicadores generales del sector (empleabilidad, satisfacción, tecnologías, etc.).
2. **Tarjeta de nuevos registros** (solo administrador): cantidad de egresados incorporados recientemente.
3. **Gráficos interactivos:** visualizaciones que se actualizan con los datos del sistema.

**Figura B.6:** Dashboard principal del administrador.

Desde el submenú **Reporte egresados** es posible desplazarse directamente a secciones específicas del dashboard:

| Submenú | Contenido |
|---------|-----------|
| **Análisis laboral** | Análisis salarial, tecnologías más demandadas, satisfacción laboral |
| **Experiencia y tecnologías** | Distribución de experiencia, tecnologías vs experiencia |
| **Indicadores avanzados** | Mapa de calor por industria, estado del mercado, métricas básicas y avanzadas |

Al seleccionar una opción, el sistema navega al dashboard y realiza **desplazamiento automático** hasta el gráfico correspondiente.

**Figura B.7:** Sección de análisis salarial en el dashboard.

**Elementos de interacción en los gráficos:**

1. **Cursor sobre barras o sectores:** muestra valores detallados en tooltip.
2. **Botón «Volver arriba»:** aparece al desplazarse hacia abajo en páginas extensas.
3. **Botón «Reintentar»:** visible si falla la carga de datos del servidor.

---

### B.2.2. Gestión de usuarios egresados

#### B.2.2.1. Usuarios activos

**Acceso:** Menú lateral → **Usuarios** → **Usuarios activos** (`/admin/view-users`).

Permite consultar y administrar los egresados registrados mediante LinkedIn.

**Figura B.8:** Listado de usuarios activos.

**Elementos de la pantalla:**

1. **Campo de búsqueda:** filtra por nombre, correo o empresa actual.
2. **Botón limpiar filtros:** restablece la búsqueda y filtros aplicados.
3. **Botón actualizar:** recarga el listado desde el servidor.
4. **Tabla de usuarios:** columnas con datos de identificación y situación laboral.
5. **Paginación:** navegación entre páginas cuando existen muchos registros.
6. **Acciones por fila:** ver detalle, editar perfil, desactivar o eliminar (según permisos configurados).

Al seleccionar un usuario, es posible abrir un **modal de edición** para modificar información profesional (posición, empresa, ubicación, tecnologías, etc.) en nombre del egresado.

**Figura B.9:** Modal de edición de perfil de egresado.

#### B.2.2.2. Usuarios eliminados

**Acceso:** Menú lateral → **Usuarios** → **Usuarios eliminados** (`/admin/view-deleted-users`).

Muestra egresados que fueron **desactivados** (eliminación lógica). Desde esta vista el administrador puede **reactivar** una cuenta para restaurar el acceso al sistema.

**Figura B.10:** Listado de usuarios eliminados.

---

### B.2.3. Gestión de administradores

#### B.2.3.1. Administradores activos

**Acceso:** Menú lateral → **Administradores** → **Administradores activos** (`/admin/view-admin`).

Listado del personal con privilegios administrativos. Permite crear nuevos administradores, editar datos y desactivar cuentas.

**Figura B.11:** Gestión de administradores activos.

#### B.2.3.2. Administradores eliminados

**Acceso:** Menú lateral → **Administradores** → **Administradores eliminados** (`/admin/view-deleted-admin`).

Funcionalidad análoga a la de usuarios eliminados: consulta de cuentas administrativas desactivadas y opción de reactivación.

**Figura B.12:** Administradores eliminados.

---

### B.2.4. Gestión de encuestas

#### B.2.4.1. Crear o editar encuesta

**Acceso:** Menú lateral → **Encuestas** → **Crear** (`/admin/create-encuesta`).

Formulario para definir una nueva encuesta o modificar una existente (ruta `/admin/editar-encuesta/:id`).

**Figura B.13:** Formulario de creación de encuesta.

**Secciones del formulario:**

1. **Datos principales:** título, estado (borrador/activa/inactiva), descripción y fechas de vigencia.
2. **Preguntas:** agregar preguntas de distintos tipos (texto, opción múltiple, escala, etc.), ordenarlas y definir si son obligatorias.
3. **Botón guardar:** persiste la encuesta en el sistema.

Si existen errores de validación (campos vacíos, fechas inconsistentes), el sistema mostrará mensajes indicando qué corregir.

#### B.2.4.2. Mis encuestas (listado administrativo)

**Acceso:** Menú lateral → **Encuestas** → **Mis encuestas** (`/admin/view-encuesta`).

Muestra las encuestas creadas por el administrador o por el sistema, con opciones para **editar**, **cambiar estado** o **eliminar**.

**Figura B.14:** Listado de encuestas del administrador.

#### B.2.4.3. Resultados de encuestas

**Acceso:** Menú lateral → **Encuestas** → **Resultados** (`/admin/view-encuestas-resultados`).

Permite analizar las respuestas recopiladas.

**Figura B.15:** Vista de resultados de encuestas.

**Elementos principales:**

1. **Selector de encuesta:** elige la encuesta a analizar.
2. **Resumen estadístico:** totales de respuestas, participación y distribución por pregunta.
3. **Gráficos de respuestas:** visualización según el tipo de pregunta.
4. **Botón exportar datos:** descarga la información de respuestas en formato exportable (CSV/Excel según implementación del servidor).

---

### B.2.5. Mi perfil (administrador)

**Acceso:** Clic en la tarjeta de perfil del menú lateral o ruta `/admin/mi-perfil`.

Permite visualizar y actualizar los datos personales del administrador (nombre, correo, contraseña, etc.).

**Figura B.16:** Perfil del administrador.

---

## B.3. Módulos del sistema — Usuario egresado

Esta sección describe las funcionalidades para usuarios con rol **egresado**.

### B.3.1. Completar perfil profesional (requisito inicial)

Tras el primer ingreso con LinkedIn, el sistema puede restringir el acceso al **dashboard** y a **encuestas** hasta que el perfil profesional esté completo.

**Acceso:** Redirección automática a `/user/mi-perfil?completar=true` o menú → clic en tarjeta de perfil.

**Figura B.17:** Aviso de perfil incompleto.

**Campos obligatorios** (deben completarse para habilitar el resto de módulos):

- Años de experiencia laboral
- Nivel de educación
- Especialidad técnica
- Tipo de empleo actual
- Disponibilidad para cambio de trabajo
- Área de interés

**Pasos recomendados:**

1. Revisar los datos importados desde LinkedIn (nombre, empresa, ubicación, resumen).
2. Completar los campos obligatorios y, opcionalmente, tecnologías, rango salarial y satisfacción laboral.
3. Presionar **«Guardar»** o el botón equivalente de actualización.
4. Verificar que el indicador de progreso muestre **100 %** o el mensaje «Perfil completado exitosamente».

**Figura B.18:** Formulario de perfil profesional del egresado.

Una vez completado el perfil, el sistema habilita el acceso al dashboard y al módulo de encuestas.

---

### B.3.2. Dashboard y reporte de egresados

**Acceso:** Menú lateral → **Reporte egresados** → **Dashboard principal** (`/user/dashboard`).

La vista es equivalente a la del administrador en cuanto a gráficos y reportes agregados (sin la tarjeta de «Nuevos registros»). El egresado puede:

1. Consultar estadísticas del mercado laboral tecnológico.
2. Navegar por las mismas subsecciones del menú (análisis laboral, experiencia, indicadores avanzados).
3. Hacer clic en su foto o nombre en el encabezado para ir a **Mi perfil**.

**Figura B.19:** Dashboard del egresado.

---

### B.3.3. Encuestas

#### B.3.3.1. Mis encuestas

**Acceso:** Menú lateral → **Encuestas** → **Mis encuestas** (`/user/view-encuestas`).

Lista las encuestas **activas** disponibles para el egresado.

**Figura B.20:** Listado de encuestas pendientes.

**Elementos:**

1. **Buscador:** filtra encuestas por título o descripción.
2. **Filtro por estado:** pendiente, en progreso o completada.
3. **Tarjeta de encuesta:** muestra título, plazo y botón **«Responder»** o **«Continuar»**.

#### B.3.3.2. Responder encuesta

**Acceso:** Botón **Responder** en una encuesta → `/user/responder-encuesta/:id`.

**Figura B.21:** Formulario de respuesta de encuesta.

**Pasos:**

1. Leer las instrucciones y cada pregunta.
2. Completar los campos obligatorios (marcados en el formulario).
3. Enviar las respuestas con el botón **«Enviar»** o **«Finalizar»**.
4. El sistema redirige a la pantalla de confirmación.

#### B.3.3.3. Encuestas completadas

**Acceso:** Menú lateral → **Encuestas** → **Encuestas completadas** (`/user/encuesta-completada`).

Historial de encuestas ya respondidas, con opción de revisar el detalle de una encuesta específica.

**Figura B.22:** Encuestas completadas.

---

### B.3.4. Mi perfil (egresado)

**Acceso:** `/user/mi-perfil` (menú lateral o clic en el encabezado del dashboard).

Permite mantener actualizada la información profesional que alimenta los reportes del sistema.

**Acciones disponibles:**

1. Editar datos personales y laborales.
2. Actualizar tecnologías y preferencias del mercado laboral.
3. Guardar cambios; el sistema recalcula el estado **perfil completo**.
4. Sincronizar o ajustar datos originados en LinkedIn.

**Figura B.23:** Perfil del egresado en modo edición.

---

## B.4. Mensajes de error frecuentes

| Situación | Mensaje / comportamiento | Acción sugerida |
|---------|--------------------------|-----------------|
| Credenciales administrativas incorrectas | Error de autenticación en pantalla | Verificar correo y contraseña; usar recuperación si aplica |
| Perfil egresado incompleto | Redirección a Mi perfil | Completar campos obligatorios |
| Sesión expirada | Redirección al login | Volver a iniciar sesión |
| Error al cargar dashboard | Botón «Reintentar» | Verificar conexión y que el servidor backend esté activo |
| Encuesta fuera de plazo | Encuesta no disponible | Contactar al administrador |

---

## B.5. Resumen de rutas del sistema

| Funcionalidad | Administrador | Egresado |
|---------------|---------------|----------|
| Login | `/auth` (modo Administrador) | `/auth` (LinkedIn) |
| Dashboard | `/admin/dashboard` | `/user/dashboard` |
| Mi perfil | `/admin/mi-perfil` | `/user/mi-perfil` |
| Usuarios activos | `/admin/view-users` | — |
| Usuarios eliminados | `/admin/view-deleted-users` | — |
| Administradores | `/admin/view-admin` | — |
| Crear encuesta | `/admin/create-encuesta` | — |
| Listar encuestas | `/admin/view-encuesta` | `/user/view-encuestas` |
| Resultados encuestas | `/admin/view-encuestas-resultados` | — |
| Responder encuesta | — | `/user/responder-encuesta/:id` |
| Encuestas completadas | — | `/user/encuesta-completada` |

---

*Fin del manual de usuario.*
