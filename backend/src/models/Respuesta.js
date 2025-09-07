const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Respuesta = sequelize.define('Respuesta', {
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
  pregunta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'preguntas',
      key: 'id'
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser null si es anónima
    references: {
      model: 'users',
      key: 'id'
    }
  },
  respuesta: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha_respuesta: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  tiempo_respuesta: {
    type: DataTypes.INTEGER, // en segundos
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45), // Para IPv6
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'respuestas',
  underscored: true,
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

module.exports = Respuesta;

