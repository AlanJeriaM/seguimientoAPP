const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  encuesta_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'encuestas',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('NUEVA_ENCUESTA', 'RECORDATORIO', 'ENCUESTA_COMPLETADA', 'SISTEMA'),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fecha_leida: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prioridad: {
    type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'),
    defaultValue: 'MEDIA'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'notificaciones',
  underscored: true,
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

module.exports = Notificacion;

