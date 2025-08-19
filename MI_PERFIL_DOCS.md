# Componente Mi Perfil - Documentación

## Descripción
El componente `MiProfileComponent` permite a los usuarios visualizar y editar su información personal y profesional obtenida desde LinkedIn. Implementa formularios reactivos con validaciones completas y una interfaz de usuario moderna.

## Funcionalidades Implementadas

### 🔧 **Backend**
- **Endpoint GET** `/api/users/mi-perfil` - Obtener datos del perfil del usuario
- **Endpoint PUT** `/api/users/mi-perfil` - Actualizar datos del perfil del usuario
- **Validaciones del servidor**: Campos requeridos y longitud máxima
- **Middleware de autenticación**: Solo usuarios autenticados pueden acceder

### 🎨 **Frontend**

#### **Formularios Reactivos**
- **FormBuilder** con validaciones personalizadas
- **Validaciones en tiempo real** con mensajes de error específicos
- **Indicadores visuales** para campos válidos/inválidos
- **Contador de caracteres** para el campo de resumen

#### **Campos del Formulario**
1. **Nombre Completo** *(requerido)*
   - Validación: mínimo 2 caracteres, máximo 100
2. **Ubicación** *(opcional)*
   - Validación: máximo 100 caracteres
3. **Posición Actual** *(opcional)*
   - Validación: máximo 150 caracteres
4. **Empresa Actual** *(opcional)*
   - Validación: máximo 150 caracteres
5. **Industria** *(opcional)*
   - Dropdown con opciones predefinidas
6. **Resumen Profesional** *(opcional)*
   - Textarea con autosize, máximo 500 caracteres

#### **UI/UX Características**
- **Header atractivo** con gradiente y avatar del usuario
- **Información de metadatos**: Fecha de registro y último acceso
- **Secciones organizadas**: Información personal, profesional y resumen
- **Animaciones suaves** con CSS transitions
- **Diseño responsive** que se adapta a móviles
- **Estados de carga** con spinners y botones deshabilitados
- **Mensajes de toast** para feedback del usuario

### 🛡️ **Validaciones Implementadas**

#### **Frontend (Angular)**
```typescript
nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
posicion_actual: ['', [Validators.maxLength(150)]]
empresa_actual: ['', [Validators.maxLength(150)]]
ubicacion: ['', [Validators.maxLength(100)]]
industria: ['', [Validators.maxLength(100)]]
resumen: ['', [Validators.maxLength(500)]]
```

#### **Backend (Node.js)**
- Validación de nombre requerido
- Sanitización de datos (trim)
- Validación de longitud en base de datos

### 📱 **Responsive Design**
- **Desktop**: Layout en dos columnas con espaciado amplio
- **Tablet**: Layout adaptado con menos columnas
- **Mobile**: Layout de una columna con elementos apilados

### 🎯 **Estados del Componente**
- **Loading**: Muestra spinner mientras carga los datos
- **Error**: Manejo de errores con mensaje y botón de reintento
- **Success**: Vista principal con formulario editable
- **Saving**: Estado de guardado con botones deshabilitados

## Uso

### **Navegación**
La ruta para acceder al componente es:
```
/user/mi-perfil
```

### **Permisos**
- Solo usuarios autenticados con rol `CLIENT-USER`
- Requiere token JWT válido en sessionStorage

### **Datos Mostrados**
- Información obtenida desde el perfil de LinkedIn
- Datos almacenados en la base de datos MySQL
- Avatar generado automáticamente con iniciales del usuario

## Tecnologías Utilizadas

### **Frontend**
- Angular 17+
- PrimeNG (UI Components)
- Reactive Forms
- RxJS (Observables)
- CSS3 (Animations & Gradients)

### **Backend**
- Node.js + Express
- Sequelize ORM
- MySQL Database
- JWT Authentication

## Mejoras Futuras Sugeridas

1. **Subida de avatar personalizado**
2. **Validación de email en tiempo real**
3. **Autocompletado para ubicaciones**
4. **Integración con APIs externas** (empresas, ubicaciones)
5. **Historial de cambios** del perfil
6. **Modo oscuro** para la interfaz
7. **Exportación de datos** en PDF
8. **Conexión directa con LinkedIn API** para sincronización

## Estructura de Archivos

```
src/app/user/pages/mi-profile/
├── mi-profile.component.ts      # Lógica del componente
├── mi-profile.component.html    # Template del formulario
├── mi-profile.component.css     # Estilos personalizados
└── mi-profile.component.spec.ts # Tests unitarios
```

## Ejemplo de Uso de la API

### **Obtener perfil**
```typescript
this.authService.obtenerMiPerfil().subscribe(response => {
  if (response.ok) {
    this.perfil = response.usuario;
  }
});
```

### **Actualizar perfil**
```typescript
const datos = {
  nombre: 'Juan Pérez',
  posicion_actual: 'Senior Developer',
  empresa_actual: 'Tech Company',
  ubicacion: 'Santiago, Chile',
  industria: 'Tecnología de la información y servicios',
  resumen: 'Desarrollador con 5 años de experiencia...'
};

this.authService.actualizarMiPerfil(datos).subscribe(response => {
  if (response.ok) {
    console.log('Perfil actualizado correctamente');
  }
});
```

El componente está completamente funcional y listo para ser usado por los estudiantes universitarios para gestionar su información profesional de cara al mercado laboral.
