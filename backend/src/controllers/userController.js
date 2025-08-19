const User = require('../models/User');
const { Op } = require('sequelize');

// Obtener todos los usuarios (solo para admin)
const obtenerUsuarios = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const offset = (page - 1) * limit;

    // Construir condiciones de búsqueda
    const whereCondition = {
      activo: true
    };

    if (search && search.trim() !== '') {
      whereCondition[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { correo: { [Op.like]: `%${search}%` } },
        { empresa_actual: { [Op.like]: `%${search}%` } },
        { posicion_actual: { [Op.like]: `%${search}%` } },
        { industria: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'linkedin_id',
        'nombre',
        'correo',
        'perfil_imagen_url',
        'posicion_actual',
        'empresa_actual',
        'ubicacion',
        'industria',
        'ultimo_acceso',
        'created_at',
        'updated_at'
      ]
    });

    // Formatear datos para mejor visualización
    const usuariosFormateados = users.rows.map(user => ({
      id: user.id,
      linkedin_id: user.linkedin_id,
      nombre: user.nombre || 'Sin nombre',
      correo: user.correo || 'Sin correo',
      perfil_imagen_url: user.perfil_imagen_url,
      posicion_actual: user.posicion_actual || 'No especificada',
      empresa_actual: user.empresa_actual || 'No especificada',
      ubicacion: user.ubicacion || 'No especificada',
      industria: user.industria || 'No especificada',
      ultimo_acceso: user.ultimo_acceso,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // Campos adicionales para mejor visualización
      fecha_registro: user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'No disponible',
      ultimo_acceso_formateado: user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleDateString('es-ES') : 'Nunca'
    }));

    res.json({
      ok: true,
      usuarios: usuariosFormateados,
      total: users.count,
      totalPages: Math.ceil(users.count / limit),
      currentPage: parseInt(page),
      hasNextPage: parseInt(page) < Math.ceil(users.count / limit),
      hasPrevPage: parseInt(page) > 1
    });

  } catch (error) {
    console.error('Error en obtenerUsuarios:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener usuarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener usuario por ID
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        msj: 'ID de usuario inválido'
      });
    }

    const user = await User.findOne({
      where: { id, activo: true },
      attributes: { exclude: ['linkedin_data'] } // Excluir datos sensibles
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        msj: 'Usuario no encontrado'
      });
    }

    // Formatear usuario para respuesta
    const usuarioFormateado = {
      id: user.id,
      linkedin_id: user.linkedin_id,
      nombre: user.nombre || 'Sin nombre',
      correo: user.correo || 'Sin correo',
      perfil_imagen_url: user.perfil_imagen_url,
      posicion_actual: user.posicion_actual || 'No especificada',
      empresa_actual: user.empresa_actual || 'No especificada',
      ubicacion: user.ubicacion || 'No especificada',
      resumen: user.resumen || 'Sin resumen',
      industria: user.industria || 'No especificada',
      ultimo_acceso: user.ultimo_acceso,
      created_at: user.created_at,
      updated_at: user.updated_at,
      rol: user.rol
    };

    res.json({
      ok: true,
      usuario: usuarioFormateado
    });

  } catch (error) {
    console.error('Error en obtenerUsuarioPorId:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener usuario'
    });
  }
};

// Desactivar usuario (soft delete)
const desactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        msj: 'ID de usuario inválido'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        ok: false,
        msj: 'Usuario no encontrado'
      });
    }

    if (!user.activo) {
      return res.status(400).json({
        ok: false,
        msj: 'El usuario ya está desactivado'
      });
    }

    // Desactivar usuario y registrar fecha de eliminación
    await user.update({ 
      activo: false,
      fecha_eliminacion: new Date()
    });

    console.log(`Usuario ${user.nombre} (ID: ${id}) desactivado por admin ${req.usuario.nombreUsuario} en ${new Date()}`);

    res.json({
      ok: true,
      msj: `Usuario ${user.nombre} desactivado correctamente`,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        fecha_eliminacion: new Date()
      }
    });

  } catch (error) {
    console.error('Error en desactivarUsuario:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al desactivar usuario'
    });
  }
};

// Obtener perfil del usuario actual
const obtenerMiPerfil = async (req, res) => {
  try {
    const user = req.user; // Viene del middleware
    
    console.log('📋 Datos completos del usuario desde middleware:', {
      id: user.id,
      nombre: user.nombre,
      created_at: user.created_at,
      createdAt: user.createdAt,
      fecha_creacion: user.fecha_creacion,
      dataValues: user.dataValues ? Object.keys(user.dataValues) : 'No dataValues'
    });

    const miPerfil = {
      id: user.id,
      nombre: user.nombre || 'Sin nombre',
      correo: user.correo || 'Sin correo',
      perfil_imagen_url: user.perfil_imagen_url,
      posicion_actual: user.posicion_actual || 'No especificada',
      empresa_actual: user.empresa_actual || 'No especificada',
      ubicacion: user.ubicacion || 'No especificada',
      resumen: user.resumen || 'Sin resumen',
      industria: user.industria || 'No especificada',
      ultimo_acceso: user.ultimo_acceso,
      fecha_registro: user.created_at,
      rol: user.rol
    };

    res.json({
      ok: true,
      usuario: miPerfil
    });

  } catch (error) {
    console.error('Error en obtenerMiPerfil:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener perfil'
    });
  }
};

// Actualizar perfil del usuario actual
const actualizarMiPerfil = async (req, res) => {
  try {
    const user = req.user; // Viene del middleware
    const { 
      nombre, 
      posicion_actual, 
      empresa_actual, 
      ubicacion, 
      resumen, 
      industria 
    } = req.body;

    // Validaciones básicas
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        ok: false,
        msj: 'El nombre es requerido'
      });
    }

    // Actualizar datos del usuario
    const datosActualizados = {
      nombre: nombre.trim(),
      posicion_actual: posicion_actual?.trim() || null,
      empresa_actual: empresa_actual?.trim() || null,
      ubicacion: ubicacion?.trim() || null,
      resumen: resumen?.trim() || null,
      industria: industria?.trim() || null
    };

    await user.update(datosActualizados);

    // Obtener usuario actualizado
    const usuarioActualizado = await User.findByPk(user.id, {
      attributes: { exclude: ['linkedin_data'] }
    });

    const perfilActualizado = {
      id: usuarioActualizado.id,
      nombre: usuarioActualizado.nombre,
      correo: usuarioActualizado.correo,
      perfil_imagen_url: usuarioActualizado.perfil_imagen_url,
      posicion_actual: usuarioActualizado.posicion_actual || 'No especificada',
      empresa_actual: usuarioActualizado.empresa_actual || 'No especificada',
      ubicacion: usuarioActualizado.ubicacion || 'No especificada',
      resumen: usuarioActualizado.resumen || 'Sin resumen',
      industria: usuarioActualizado.industria || 'No especificada',
      ultimo_acceso: usuarioActualizado.ultimo_acceso,
      fecha_registro: usuarioActualizado.created_at,
      rol: usuarioActualizado.rol
    };

    console.log(`Perfil actualizado para usuario ${usuarioActualizado.nombre} (ID: ${user.id})`);

    res.json({
      ok: true,
      msj: 'Perfil actualizado correctamente',
      usuario: perfilActualizado
    });

  } catch (error) {
    console.error('Error en actualizarMiPerfil:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al actualizar perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Estadísticas para dashboard
const obtenerEstadisticas = async (req, res) => {
  try {
    // Total de usuarios activos
    const totalUsuarios = await User.count({ where: { activo: true } });

    // Usuarios registrados en los últimos 30 días
    const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const usuariosRecientes = await User.count({
      where: {
        activo: true,
        created_at: {
          [Op.gte]: fechaLimite
        }
      }
    });

    // Usuarios por industria (solo los 10 principales)
    const usuariosPorIndustria = await User.findAll({
      where: {
        activo: true,
        industria: {
          [Op.and]: [
            { [Op.not]: null },
            { [Op.ne]: '' },
            { [Op.ne]: 'No especificada' }
          ]
        }
      },
      attributes: [
        'industria',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'cantidad']
      ],
      group: ['industria'],
      order: [[User.sequelize.fn('COUNT', User.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Empresas más comunes
    const empresasMasComunes = await User.findAll({
      where: {
        activo: true,
        empresa_actual: {
          [Op.and]: [
            { [Op.not]: null },
            { [Op.ne]: '' },
            { [Op.ne]: 'No especificada' }
          ]
        }
      },
      attributes: [
        'empresa_actual',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'cantidad']
      ],
      group: ['empresa_actual'],
      order: [[User.sequelize.fn('COUNT', User.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Usuarios con acceso reciente (últimos 7 días)
    const fechaAccesoReciente = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const usuariosActivos = await User.count({
      where: {
        activo: true,
        ultimo_acceso: {
          [Op.gte]: fechaAccesoReciente
        }
      }
    });

    res.json({
      ok: true,
      estadisticas: {
        totalUsuarios,
        usuariosRecientes,
        usuariosActivos,
        usuariosPorIndustria: usuariosPorIndustria.map(item => ({
          industria: item.industria,
          cantidad: parseInt(item.cantidad)
        })),
        empresasMasComunes: empresasMasComunes.map(item => ({
          empresa: item.empresa_actual,
          cantidad: parseInt(item.cantidad)
        })),
        resumen: {
          registrados_ultimo_mes: usuariosRecientes,
          activos_ultima_semana: usuariosActivos,
          porcentaje_actividad: totalUsuarios > 0 ? Math.round((usuariosActivos / totalUsuarios) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener usuarios eliminados (solo para admin)
const obtenerUsuariosEliminados = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const offset = (page - 1) * limit;

    // Construir condiciones de búsqueda para usuarios inactivos
    const whereCondition = {
      activo: false
    };

    if (search && search.trim() !== '') {
      whereCondition[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { correo: { [Op.like]: `%${search}%` } },
        { empresa_actual: { [Op.like]: `%${search}%` } },
        { posicion_actual: { [Op.like]: `%${search}%` } },
        { industria: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fecha_eliminacion', 'DESC']], // Ordenar por fecha de eliminación
      attributes: [
        'id',
        'linkedin_id',
        'nombre',
        'correo',
        'perfil_imagen_url',
        'posicion_actual',
        'empresa_actual',
        'ubicacion',
        'industria',
        'created_at',
        'updated_at',
        'fecha_eliminacion'
      ]
    });

    // Formatear datos para mejor visualización
    const usuariosFormateados = users.rows.map(user => ({
      id: user.id,
      linkedin_id: user.linkedin_id,
      nombre: user.nombre || 'Sin nombre',
      correo: user.correo || 'Sin correo',
      perfil_imagen_url: user.perfil_imagen_url,
      posicion_actual: user.posicion_actual || 'No especificada',
      empresa_actual: user.empresa_actual || 'No especificada',
      ubicacion: user.ubicacion || 'No especificada',
      industria: user.industria || 'No especificada',
      fecha_eliminacion: user.fecha_eliminacion || user.updated_at,
      fecha_registro: user.created_at
    }));

    console.log(`Usuarios eliminados obtenidos: ${usuariosFormateados.length} de ${users.count}`);

    res.json({
      ok: true,
      usuarios: usuariosFormateados,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit)
    });

  } catch (error) {
    console.error('Error en obtenerUsuariosEliminados:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener usuarios eliminados',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reactivar usuario (solo para admin)
const reactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe y está inactivo
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        ok: false,
        msj: 'Usuario no encontrado'
      });
    }

    if (user.activo) {
      return res.status(400).json({
        ok: false,
        msj: 'El usuario ya está activo'
      });
    }

    // Reactivar usuario y limpiar fecha de eliminación
    await user.update({ 
      activo: true,
      ultimo_acceso: null, // Resetear último acceso
      fecha_eliminacion: null // Limpiar fecha de eliminación
    });

    console.log(`Usuario reactivado: ${user.nombre} (ID: ${id})`);

    res.json({
      ok: true,
      msj: 'Usuario reactivado correctamente',
      usuario: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo
      }
    });

  } catch (error) {
    console.error('Error en reactivarUsuario:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al reactivar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar usuario permanentemente (solo para admin)
const eliminarUsuarioPermanentemente = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe y está inactivo
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        ok: false,
        msj: 'Usuario no encontrado'
      });
    }

    if (user.activo) {
      return res.status(400).json({
        ok: false,
        msj: 'No se puede eliminar permanentemente un usuario activo. Primero desactívalo.'
      });
    }

    // Guardar información del usuario antes de eliminarlo
    const usuarioInfo = {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      linkedin_id: user.linkedin_id,
      fecha_registro: user.created_at,
      fecha_eliminacion: user.updated_at
    };

    // Eliminar permanentemente de la base de datos
    await user.destroy();

    console.log(`Usuario eliminado permanentemente: ${usuarioInfo.nombre} (ID: ${id})`);

    res.json({
      ok: true,
      msj: 'Usuario eliminado permanentemente',
      usuario: usuarioInfo
    });

  } catch (error) {
    console.error('Error en eliminarUsuarioPermanentemente:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al eliminar usuario permanentemente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  desactivarUsuario,
  obtenerMiPerfil,
  actualizarMiPerfil,
  obtenerEstadisticas,
  obtenerUsuariosEliminados,
  reactivarUsuario,
  eliminarUsuarioPermanentemente
};
