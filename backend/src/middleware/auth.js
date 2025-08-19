const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Middleware para verificar token JWT
const verificarToken = async (req, res, next) => {
  try {
    const token = req.header('token');

    if (!token) {
      return res.status(401).json({
        ok: false,
        msj: 'No hay token en la petición'
      });
    }

    // Verificar el token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;

    next();
  } catch (error) {
    console.error('Error en verificarToken:', error);
    return res.status(401).json({
      ok: false,
      msj: 'Token no válido'
    });
  }
};

// Middleware para verificar que sea administrador
const verificarAdmin = async (req, res, next) => {
  try {
    const { id, rol } = req.usuario;

    if (rol !== 'ADMIN-USER') {
      return res.status(403).json({
        ok: false,
        msj: 'No tienes permisos de administrador'
      });
    }

    // Verificar que el admin existe y está activo
    const admin = await Admin.findByPk(id);
    if (!admin || !admin.activo) {
      return res.status(403).json({
        ok: false,
        msj: 'Administrador no encontrado o inactivo'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Error en verificarAdmin:', error);
    return res.status(500).json({
      ok: false,
      msj: 'Error del servidor'
    });
  }
};

// Middleware para verificar que sea usuario cliente
const verificarCliente = async (req, res, next) => {
  try {
    const { id, rol } = req.usuario;

    if (rol !== 'CLIENT-USER') {
      return res.status(403).json({
        ok: false,
        msj: 'No tienes permisos de usuario'
      });
    }

    // Verificar que el usuario existe y está activo
    const user = await User.findByPk(id, {
      attributes: { exclude: ['linkedin_data'] }
    });
    if (!user || !user.activo) {
      return res.status(403).json({
        ok: false,
        msj: 'Usuario no encontrado o inactivo'
      });
    }

    // Actualizar último acceso
    await user.update({ ultimo_acceso: new Date() });

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en verificarCliente:', error);
    return res.status(500).json({
      ok: false,
      msj: 'Error del servidor'
    });
  }
};

module.exports = {
  verificarToken,
  verificarAdmin,
  verificarCliente
};
