const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Encuesta = sequelize.define('Encuesta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('BORRADOR', 'ACTIVA'),
    defaultValue: 'BORRADOR',
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // tiempo_estimado: {
  //   type: DataTypes.INTEGER, // en minutos
  //   allowNull: true,
  //   defaultValue: 10
  // },
  // max_respuestas: {
  //   type: DataTypes.INTEGER,
  //   allowNull: true
  // },
  es_anonima: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // permite_multiple_respuesta: {
  //   type: DataTypes.BOOLEAN,
  //   defaultValue: false
  // },
  admin_creador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fecha_eliminacion: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'encuestas',
  underscored: true,
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

module.exports = Encuesta;

