# SeguimientoApp

Una aplicación web completa desarrollada con **Angular 18** y **Node.js** para el seguimiento y análisis del mercado laboral tecnológico, con integración de LinkedIn y visualizaciones avanzadas de datos.

## Descripción del Proyecto

SeguimientoApp es una plataforma integral que permite a profesionales del sector tecnológico:

- **Gestionar perfiles profesionales** con datos de LinkedIn
- **Visualizar métricas del mercado laboral** en tiempo real
- **Analizar tendencias salariales** por industria y experiencia
- **Seguir tecnologías más demandadas** en el mercado
- **Administrar usuarios y encuestas** desde un panel administrativo

## Arquitectura del Sistema

### Frontend (Angular 18)
- **Framework:** Angular 18.1.1 con TypeScript
- **UI Components:** PrimeNG para componentes profesionales
- **Charts:** Chart.js para visualizaciones de datos avanzadas
- **Routing:** Sistema de rutas con guards de autenticación
- **State Management:** RxJS para manejo de estado reactivo

### Backend (Node.js)
- **Framework:** Express.js
- **Base de Datos:** MySQL con Sequelize ORM
- **Autenticación:** JWT + OAuth LinkedIn
- **APIs RESTful:** Endpoints para todas las funcionalidades
- **Middleware:** Validación, autenticación y manejo de errores

## Funcionalidades Principales

### Gestión de Usuarios
- **Registro/Login:** Integración completa con LinkedIn OAuth
- **Perfiles Completos:** Edición de información profesional
- **Normalización de Datos:** Consistencia en campos de texto
- **Gestión de Tecnologías:** Selección múltiple con opciones personalizadas

### Dashboard Analítico
- **Métricas del Mercado:** Estadísticas generales del sector tecnológico
- **Distribución Salarial:** Análisis por industria y rangos salariales
- **Tecnologías Demandadas:** Ranking de tecnologías más populares
- **Empresas Contratantes:** Top empresas que más contratan
- **Satisfacción Laboral:** Métricas de satisfacción por empresa
- **Evolución Salarial:** Análisis de salarios por años de experiencia

### Visualizaciones Avanzadas
- **Gráficos Interactivos:** 15+ tipos de visualizaciones diferentes
- **Mapas de Calor:** Distribución salarial por industria
- **Gráficos de Radar:** Comparación multi-dimensional
- **Barras Apiladas:** Análisis de composición por categorías
- **Efectos Hover:** Interactividad mejorada en todos los gráficos

### Panel Administrativo
- **Gestión de Usuarios:** CRUD completo de usuarios
- **Creación de Encuestas:** Sistema de encuestas personalizables
- **Reportes Avanzados:** Análisis detallados del mercado
- **Administración de Datos:** Normalización y limpieza de datos

## Tecnologías Utilizadas

### Frontend
- **Angular 18.1.1** - Framework principal
- **PrimeNG** - Biblioteca de componentes UI
- **Chart.js** - Visualizaciones de datos
- **RxJS** - Programación reactiva
- **TypeScript** - Tipado estático
- **CSS3** - Estilos y animaciones

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de datos relacional
- **Sequelize** - ORM para MySQL
- **JWT** - Autenticación basada en tokens
- **bcryptjs** - Encriptación de contraseñas
- **Passport.js** - Autenticación OAuth

### Herramientas de Desarrollo
- **Angular CLI** - Herramientas de desarrollo
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **Git** - Control de versiones

## Estructura del Proyecto

```
seguimientoApp/
├── src/app/                    # Código fuente Angular
│   ├── admin/                  # Módulo administrativo
│   ├── auth/                   # Módulo de autenticación
│   ├── user/                   # Módulo de usuario
│   ├── shared/                 # Componentes compartidos
│   └── core/                   # Servicios y guards
├── backend/                    # Servidor Node.js
│   ├── src/
│   │   ├── controllers/        # Controladores de API
│   │   ├── models/            # Modelos de base de datos
│   │   ├── routes/            # Rutas de API
│   │   └── middleware/        # Middleware personalizado
│   └── scripts/               # Scripts de utilidad
├── public/                     # Archivos estáticos
└── dist/                      # Build de producción
```

## Instalación y Configuración

### Prerrequisitos
- **Node.js** (versión 18 o superior)
- **MySQL** (versión 8.0 o superior)
- **Angular CLI** (`npm install -g @angular/cli`)

### Instalación

1. **Clonar el repositorio:**
```bash
git clone [url-del-repositorio]
cd seguimientoApp
```

2. **Instalar dependencias del frontend:**
```bash
npm install
```

3. **Instalar dependencias del backend:**
```bash
cd backend
npm install
```

4. **Configurar base de datos:**
```bash
# Crear base de datos MySQL
mysql -u root -p
CREATE DATABASE seguimiento_app;
```

5. **Configurar variables de entorno:**
```bash
# En backend/.env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=seguimiento_app
JWT_SECRET=tu_jwt_secret
LINKEDIN_CLIENT_ID=tu_client_id
LINKEDIN_CLIENT_SECRET=tu_client_secret
```

## 🏃‍♂️ Ejecución del Proyecto

### Servidor de Desarrollo (Frontend)
```bash
ng serve
```
Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias archivos fuente.

### Servidor de Desarrollo (Backend)
```bash
cd backend
npm run dev
```
El servidor API estará disponible en `http://localhost:3000/`

### Construcción para Producción
```bash
# Frontend
ng build --configuration production

# Backend
cd backend
npm run build
```

## Testing

### Pruebas Unitarias
```bash
ng test
```
Ejecuta las pruebas unitarias vía [Karma](https://karma-runner.github.io).

### Pruebas End-to-End
```bash
ng e2e
```
Ejecuta las pruebas end-to-end en la plataforma de tu elección.

## Características Técnicas Destacadas

### Sistema de Visualizaciones
- **15+ tipos de gráficos** diferentes con Chart.js
- **Paleta de colores unificada** para consistencia visual
- **Efectos hover personalizados** para mejor UX
- **Tooltips informativos** con datos contextuales
- **Gráficos responsivos** que se adaptan a diferentes pantallas

### Sistema de Autenticación
- **OAuth LinkedIn** para registro/login social
- **JWT tokens** para autenticación segura
- **Guards de ruta** para proteger páginas privadas
- **Middleware de autenticación** en el backend

### Análisis de Datos
- **Normalización automática** de datos de texto
- **Agregaciones complejas** en base de datos
- **Cálculos estadísticos** en tiempo real
- **Filtros dinámicos** por múltiples criterios

### Seguridad
- **Validación de datos** en frontend y backend
- **Sanitización de inputs** para prevenir XSS
- **Encriptación de contraseñas** con bcrypt
- **CORS configurado** para seguridad de API



