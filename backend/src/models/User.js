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
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

module.exports = User;
