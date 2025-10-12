const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SesionEncuesta = sequelize.define('SesionEncuesta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  encuesta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'encuestas',
      key: 'id'
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  session_token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  estado: {
    type: DataTypes.ENUM('INICIADA', 'EN_PROGRESO', 'COMPLETADA', 'ABANDONADA'),
    defaultValue: 'INICIADA'
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tiempo_total: {
    type: DataTypes.INTEGER, // en segundos
    allowNull: true
  },
  progreso: {
    type: DataTypes.INTEGER, // porcentaje completado (0-100)
    defaultValue: 0
  },
  pregunta_actual: {
    type: DataTypes.INTEGER, // índice de la pregunta actual
    allowNull: true,
    defaultValue: 0
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sesiones_encuesta',
  underscored: true,
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

module.exports = SesionEncuesta;

