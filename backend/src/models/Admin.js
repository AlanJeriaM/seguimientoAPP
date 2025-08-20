const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  contrasenia: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100] // Mínimo 6 caracteres
    }
  },
  nombre_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Administrador'
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Apellido del administrador'
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ADMIN-USER'
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
    comment: 'Fecha cuando el administrador fue desactivado/eliminado'
  }
}, {
  tableName: 'admins',
  timestamps: true,
  underscored: true
});

// Hash de la contraseña antes de guardar
Admin.beforeCreate(async (admin) => {
  if (admin.contrasenia) {
    const salt = await bcrypt.genSalt(10);
    admin.contrasenia = await bcrypt.hash(admin.contrasenia, salt);
  }
});

Admin.beforeUpdate(async (admin) => {
  if (admin.changed('contrasenia')) {
    const salt = await bcrypt.genSalt(10);
    admin.contrasenia = await bcrypt.hash(admin.contrasenia, salt);
  }
});

// Método para verificar contraseña
Admin.prototype.verificarContrasenia = async function(contrasenia) {
  return await bcrypt.compare(contrasenia, this.contrasenia);
};

module.exports = Admin;
