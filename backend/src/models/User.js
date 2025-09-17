const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  linkedin_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'ID único de LinkedIn'
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nombre completo del usuario'
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  linkedin_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Datos completos de LinkedIn en formato JSON'
  },
  perfil_imagen_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL de la imagen de perfil'
  },
  posicion_actual: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Posición laboral actual'
  },
  empresa_actual: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Empresa donde trabaja actualmente'
  },
  ubicacion: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ubicación geográfica'
  },
  resumen: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Resumen profesional'
  },
  industria: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Industria en la que trabaja'
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'CLIENT-USER'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Última vez que accedió al sistema'
  },
  fecha_eliminacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando el usuario fue desactivado/eliminado'
  },
  // Campos adicionales para métricas y análisis
  perfil_completo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si el usuario completó todos los campos obligatorios del perfil'
  },
  años_experiencia: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Años totales de experiencia profesional'
  },
  nivel_educacion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Niveles de educación completados (JSON array)'
  },
  especialidad_tecnica: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Tecnologías dominadas por el usuario (JSON array)'
  },
  tipo_empleo_actual: {
    type: DataTypes.ENUM('Tiempo completo', 'Part-time', 'Freelance', 'Desempleado', 'Estudiante', 'Otro'),
    allowNull: true,
    comment: 'Tipo de empleo actual'
  },
  rango_salarial: {
    type: DataTypes.ENUM('0-500k', '500k-1M', '1M-1.5M', '1.5M-2M', '2M-3M', '3M+', 'Prefiero no decir'),
    allowNull: true,
    comment: 'Rango salarial mensual en CLP para análisis estadístico'
  },
  disponibilidad_cambio: {
    type: DataTypes.ENUM('Activamente buscando', 'Abierto a oportunidades', 'No disponible', 'No seguro', 'Sin trabajo'),
    allowNull: true,
    comment: 'Disponibilidad para cambio de trabajo'
  },
  tecnologias_principales: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array de tecnologías principales que maneja'
  },
  area_interes: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Área de interés profesional (Frontend, Backend, DevOps, etc.)'
  },
  satisfaccion_laboral: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Nivel de satisfacción laboral actual (1-5 estrellas)'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

module.exports = User;
