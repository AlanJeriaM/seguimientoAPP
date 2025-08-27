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
  },
  codigo_restablecimiento: {
    type: DataTypes.STRING(6),
    allowNull: true,
    comment: 'Código de 6 dígitos para restablecer contraseña'
  },
  codigo_expiracion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración del código de restablecimiento'
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
    // Solo hashear si la contraseña NO parece estar ya hasheada
    // Los hashes de bcrypt siempre empiezan con $2a$ o $2b$ y tienen 60 caracteres
    if (!admin.contrasenia.startsWith('$2a$') && !admin.contrasenia.startsWith('$2b$') && admin.contrasenia.length !== 60) {
      const salt = await bcrypt.genSalt(10);
      admin.contrasenia = await bcrypt.hash(admin.contrasenia, salt);
    }
  }
});

// Método para verificar contraseña
Admin.prototype.verificarContrasenia = async function(contrasenia) {
  return await bcrypt.compare(contrasenia, this.contrasenia);
};

module.exports = Admin;
