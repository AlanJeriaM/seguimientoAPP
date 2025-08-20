const Admin = require('../models/Admin');
const { Op } = require('sequelize');

// Obtener todos los administradores activos (solo para super admin)
const obtenerAdministradores = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const offset = (page - 1) * limit;

    // Construir condiciones de búsqueda
    const whereCondition = {
      activo: true
    };

    if (search && search.trim() !== '') {
      whereCondition[Op.or] = [
        { nombre_usuario: { [Op.like]: `%${search}%` } },
        { apellido: { [Op.like]: `%${search}%` } },
        { email_usuario: { [Op.like]: `%${search}%` } }
      ];
    }

    const admins = await Admin.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'email_usuario',
        'nombre_usuario',
        'apellido',
        'rol',
        'ultimo_acceso',
        'created_at',
        'updated_at'
      ]
    });

    // Formatear datos para mejor visualización
    const administradoresFormateados = admins.rows.map(admin => ({
      id: admin.id,
      email_usuario: admin.email_usuario,
      nombre_usuario: admin.nombre_usuario || 'Sin nombre',
      apellido: admin.apellido || 'Sin apellido',
      nombre_completo: `${admin.nombre_usuario || ''} ${admin.apellido || ''}`.trim(),
      rol: admin.rol,
      ultimo_acceso: admin.ultimo_acceso,
      fecha_registro: admin.created_at,
      fecha_actualizacion: admin.updated_at
    }));

    console.log(`Administradores obtenidos: ${administradoresFormateados.length} de ${admins.count}`);

    res.json({
      ok: true,
      administradores: administradoresFormateados,
      total: admins.count,
      page: parseInt(page),
      totalPages: Math.ceil(admins.count / limit)
    });

  } catch (error) {
    console.error('Error en obtenerAdministradores:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener administradores',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener administradores eliminados (solo para super admin)
const obtenerAdministradoresEliminados = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const offset = (page - 1) * limit;

    // Construir condiciones de búsqueda para administradores inactivos
    const whereCondition = {
      activo: false
    };

    if (search && search.trim() !== '') {
      whereCondition[Op.or] = [
        { nombre_usuario: { [Op.like]: `%${search}%` } },
        { apellido: { [Op.like]: `%${search}%` } },
        { email_usuario: { [Op.like]: `%${search}%` } }
      ];
    }

    const admins = await Admin.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fecha_eliminacion', 'DESC']], // Ordenar por fecha de eliminación
      attributes: [
        'id',
        'email_usuario',
        'nombre_usuario',
        'apellido',
        'rol',
        'ultimo_acceso',
        'created_at',
        'updated_at',
        'fecha_eliminacion'
      ]
    });

    // Formatear datos para mejor visualización
    const administradoresFormateados = admins.rows.map(admin => ({
      id: admin.id,
      email_usuario: admin.email_usuario,
      nombre_usuario: admin.nombre_usuario || 'Sin nombre',
      apellido: admin.apellido || 'Sin apellido',
      nombre_completo: `${admin.nombre_usuario || ''} ${admin.apellido || ''}`.trim(),
      rol: admin.rol,
      ultimo_acceso: admin.ultimo_acceso,
      fecha_registro: admin.created_at,
      fecha_eliminacion: admin.fecha_eliminacion || admin.updated_at
    }));

    console.log(`Administradores eliminados obtenidos: ${administradoresFormateados.length} de ${admins.count}`);

    res.json({
      ok: true,
      administradores: administradoresFormateados,
      total: admins.count,
      page: parseInt(page),
      totalPages: Math.ceil(admins.count / limit)
    });

  } catch (error) {
    console.error('Error en obtenerAdministradoresEliminados:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener administradores eliminados',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear nuevo administrador (solo para super admin)
const crearAdministrador = async (req, res) => {
  try {
    const { nombre_usuario, apellido, email_usuario, contrasenia } = req.body;

    // Validaciones básicas
    if (!nombre_usuario || !email_usuario || !contrasenia) {
      return res.status(400).json({
        ok: false,
        msj: 'Nombre, correo electrónico y contraseña son requeridos'
      });
    }

    if (contrasenia.length < 6) {
      return res.status(400).json({
        ok: false,
        msj: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar que no exista un administrador con el mismo correo
    const adminExistente = await Admin.findOne({
      where: { email_usuario: email_usuario.toLowerCase() }
    });

    if (adminExistente) {
      return res.status(400).json({
        ok: false,
        msj: 'Ya existe un administrador con este correo electrónico'
      });
    }

    // Crear el nuevo administrador
    const nuevoAdmin = await Admin.create({
      nombre_usuario: nombre_usuario.trim(),
      apellido: apellido?.trim() || null,
      email_usuario: email_usuario.toLowerCase().trim(),
      contrasenia: contrasenia,
      rol: 'ADMIN-USER',
      activo: true
      // ultimo_acceso se establecerá cuando realmente acceda al sistema
    });

    console.log(`Nuevo administrador creado: ${nuevoAdmin.nombre_usuario} (${nuevoAdmin.email_usuario})`);

    res.status(201).json({
      ok: true,
      msj: 'Administrador creado correctamente',
      administrador: {
        id: nuevoAdmin.id,
        nombre_usuario: nuevoAdmin.nombre_usuario,
        apellido: nuevoAdmin.apellido,
        email_usuario: nuevoAdmin.email_usuario,
        rol: nuevoAdmin.rol,
        fecha_registro: nuevoAdmin.created_at
      }
    });

  } catch (error) {
    console.error('Error en crearAdministrador:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al crear administrador',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener administrador por ID (solo para super admin)
const obtenerAdministradorPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        msj: 'ID de administrador inválido'
      });
    }

    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ['contrasenia'] }
    });

    if (!admin) {
      return res.status(404).json({
        ok: false,
        msj: 'Administrador no encontrado'
      });
    }

    const adminFormateado = {
      id: admin.id,
      email_usuario: admin.email_usuario,
      nombre_usuario: admin.nombre_usuario,
      apellido: admin.apellido,
      nombre_completo: `${admin.nombre_usuario || ''} ${admin.apellido || ''}`.trim(),
      rol: admin.rol,
      activo: admin.activo,
      ultimo_acceso: admin.ultimo_acceso,
      fecha_registro: admin.created_at,
      fecha_actualizacion: admin.updated_at,
      fecha_eliminacion: admin.fecha_eliminacion
    };

    res.json({
      ok: true,
      administrador: adminFormateado
    });

  } catch (error) {
    console.error('Error en obtenerAdministradorPorId:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener administrador'
    });
  }
};

// Actualizar administrador (solo para super admin)
const actualizarAdministrador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_usuario, apellido, email_usuario, contrasenia } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        msj: 'ID de administrador inválido'
      });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        ok: false,
        msj: 'Administrador no encontrado'
      });
    }

    // Validaciones básicas
    if (!nombre_usuario || !email_usuario) {
      return res.status(400).json({
        ok: false,
        msj: 'Nombre y correo electrónico son requeridos'
      });
    }

    // Verificar que no exista otro administrador con el mismo correo
    if (email_usuario.toLowerCase() !== admin.email_usuario) {
      const adminExistente = await Admin.findOne({
        where: { 
          email_usuario: email_usuario.toLowerCase(),
          id: { [Op.ne]: id }
        }
      });

      if (adminExistente) {
        return res.status(400).json({
          ok: false,
          msj: 'Ya existe un administrador con este correo electrónico'
        });
      }
    }

    // Preparar datos de actualización
    const datosActualizacion = {
      nombre_usuario: nombre_usuario.trim(),
      apellido: apellido?.trim() || null,
      email_usuario: email_usuario.toLowerCase().trim()
      // ultimo_acceso solo se actualiza cuando realmente acceden al sistema
    };

    // Solo actualizar contraseña si se proporciona
    if (contrasenia && contrasenia.trim() !== '') {
      if (contrasenia.length < 6) {
        return res.status(400).json({
          ok: false,
          msj: 'La contraseña debe tener al menos 6 caracteres'
        });
      }
      datosActualizacion.contrasenia = contrasenia;
    }

    // Actualizar administrador
    await admin.update(datosActualizacion);

    // Obtener administrador actualizado
    const adminActualizado = await Admin.findByPk(id, {
      attributes: { exclude: ['contrasenia'] }
    });

    console.log(`Administrador actualizado: ${adminActualizado.nombre_usuario} (ID: ${id})`);

    res.json({
      ok: true,
      msj: 'Administrador actualizado correctamente',
      administrador: {
        id: adminActualizado.id,
        nombre_usuario: adminActualizado.nombre_usuario,
        apellido: adminActualizado.apellido,
        email_usuario: adminActualizado.email_usuario,
        rol: adminActualizado.rol
      }
    });

  } catch (error) {
    console.error('Error en actualizarAdministrador:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al actualizar administrador',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Desactivar administrador (soft delete)
const desactivarAdministrador = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        msj: 'ID de administrador inválido'
      });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        ok: false,
        msj: 'Administrador no encontrado'
      });
    }

    if (!admin.activo) {
      return res.status(400).json({
        ok: false,
        msj: 'El administrador ya está desactivado'
      });
    }

    // Verificar que no sea el último administrador activo
    const administradoresActivos = await Admin.count({
      where: { activo: true }
    });

    if (administradoresActivos <= 1) {
      return res.status(400).json({
        ok: false,
        msj: 'No se puede desactivar el último administrador activo del sistema'
      });
    }

    // Desactivar administrador y registrar fecha de eliminación
    await admin.update({ 
      activo: false,
      fecha_eliminacion: new Date()
    });

    console.log(`Administrador ${admin.nombre_usuario} (ID: ${id}) desactivado por admin ${req.usuario.nombreUsuario} en ${new Date()}`);

    res.json({
      ok: true,
      msj: `Administrador ${admin.nombre_usuario} desactivado correctamente`,
      administrador: {
        id: admin.id,
        nombre_usuario: admin.nombre_usuario,
        email_usuario: admin.email_usuario,
        fecha_eliminacion: new Date()
      }
    });

  } catch (error) {
    console.error('Error en desactivarAdministrador:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al desactivar administrador'
    });
  }
};

// Reactivar administrador (solo para super admin)
const reactivarAdministrador = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el administrador existe y está inactivo
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        ok: false,
        msj: 'Administrador no encontrado'
      });
    }

    if (admin.activo) {
      return res.status(400).json({
        ok: false,
        msj: 'El administrador ya está activo'
      });
    }

    // Reactivar administrador y limpiar fecha de eliminación
    await admin.update({ 
      activo: true,
      ultimo_acceso: null, // Resetear último acceso
      fecha_eliminacion: null // Limpiar fecha de eliminación
    });

    console.log(`Administrador reactivado: ${admin.nombre_usuario} (ID: ${id})`);

    res.json({
      ok: true,
      msj: 'Administrador reactivado correctamente',
      administrador: {
        id: admin.id,
        nombre_usuario: admin.nombre_usuario,
        email_usuario: admin.email_usuario
      }
    });

  } catch (error) {
    console.error('Error en reactivarAdministrador:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al reactivar administrador',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar administrador permanentemente (solo para super admin)
const eliminarAdministradorPermanentemente = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el administrador existe y está inactivo
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        ok: false,
        msj: 'Administrador no encontrado'
      });
    }

    if (admin.activo) {
      return res.status(400).json({
        ok: false,
        msj: 'No se puede eliminar permanentemente un administrador activo. Primero desactívalo.'
      });
    }

    // Guardar información del administrador antes de eliminarlo
    const adminInfo = {
      id: admin.id,
      nombre_usuario: admin.nombre_usuario,
      apellido: admin.apellido,
      email_usuario: admin.email_usuario,
      fecha_registro: admin.created_at,
      fecha_eliminacion: admin.fecha_eliminacion
    };

    // Eliminar permanentemente de la base de datos
    await admin.destroy();

    console.log(`Administrador eliminado permanentemente: ${adminInfo.nombre_usuario} (ID: ${id})`);

    res.json({
      ok: true,
      msj: 'Administrador eliminado permanentemente',
      administrador: adminInfo
    });

  } catch (error) {
    console.error('Error en eliminarAdministradorPermanentemente:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al eliminar administrador permanentemente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  obtenerAdministradores,
  obtenerAdministradoresEliminados,
  crearAdministrador,
  obtenerAdministradorPorId,
  actualizarAdministrador,
  desactivarAdministrador,
  reactivarAdministrador,
  eliminarAdministradorPermanentemente
};
