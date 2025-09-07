const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pregunta = sequelize.define('Pregunta', {
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
  texto: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  tipo: {
    type: DataTypes.ENUM('TEXTO_CORTO', 'TEXTO_LARGO', 'OPCION_UNICA', 'OPCION_MULTIPLE', 'ESCALA', 'FECHA', 'NUMERO'),
    allowNull: false,
    defaultValue: 'TEXTO_CORTO'
  },
  es_requerida: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  opciones: {
    type: DataTypes.JSON, // Para preguntas de opción múltiple
    allowNull: true
  },
  configuracion: {
    type: DataTypes.JSON, // Para configuraciones adicionales (escala, validaciones, etc.)
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'preguntas',
  underscored: true,
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

module.exports = Pregunta;

