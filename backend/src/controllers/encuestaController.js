const { Encuesta, Pregunta, Respuesta, SesionEncuesta, Notificacion, User, Admin } = require('../config/associations');
const { Op } = require('sequelize');

// Crear nueva encuesta
const crearEncuesta = async (req, res) => {
  try {
    const { 
      titulo, 
      descripcion, 
      estado, 
      fecha_inicio, 
      fecha_fin, 
      es_anonima,
      preguntas 
    } = req.body;

    const adminId = req.usuario.id;

    // Validar campos requeridos
    if (!titulo || !preguntas || !Array.isArray(preguntas) || preguntas.length === 0) {
      return res.status(400).json({
        ok: false,
        msj: 'Título y preguntas son obligatorios'
      });
    }

    // Crear la encuesta
    const encuesta = await Encuesta.create({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      estado: estado || 'BORRADOR',
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      es_anonima: es_anonima || false,
      admin_creador_id: adminId
    });

    // Crear las preguntas
    const preguntasCreadas = [];
    for (let i = 0; i < preguntas.length; i++) {
      const pregunta = preguntas[i];
      const preguntaCreada = await Pregunta.create({
        encuesta_id: encuesta.id,
        texto: pregunta.texto.trim(),
        tipo: pregunta.tipo || 'TEXTO_CORTO',
        es_requerida: pregunta.es_requerida !== false,
        orden: i + 1,
        opciones: pregunta.opciones || null,
        configuracion: pregunta.configuracion || null
      });
      preguntasCreadas.push(preguntaCreada);
    }

    // Si la encuesta está activa, crear notificaciones para todos los usuarios
    if (estado === 'ACTIVA') {
      const usuarios = await User.findAll({ 
        where: { activo: true },
        attributes: ['id']
      });

      const notificaciones = usuarios.map(usuario => ({
        usuario_id: usuario.id,
        encuesta_id: encuesta.id,
        tipo: 'NUEVA_ENCUESTA',
        titulo: 'Nueva Encuesta Disponible',
        mensaje: `Tienes una nueva encuesta disponible: "${titulo}".`,
        prioridad: 'MEDIA'
      }));

      await Notificacion.bulkCreate(notificaciones);
    }

    console.log(`Encuesta creada: ${titulo} (ID: ${encuesta.id}) con ${preguntasCreadas.length} preguntas`);

    res.status(201).json({
      ok: true,
      msj: 'Encuesta creada correctamente',
      data: {
        encuesta: {
          id: encuesta.id,
          titulo: encuesta.titulo,
          estado: encuesta.estado,
          fecha_creacion: encuesta.fecha_creacion
        },
        preguntas: preguntasCreadas.length
      }
    });

  } catch (error) {
    console.error('Error en crearEncuesta:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al crear la encuesta'
    });
  }
};

// Obtener todas las encuestas del admin
const obtenerEncuestas = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      activo: true
    };

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado;
    }

    // Preparar búsqueda avanzada
    if (search) {
      const searchLower = search.toLowerCase();
      const searchConditions = [
        { titulo: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } }
      ];
      
      // Si es un número, buscar también por ID
      if (!isNaN(search)) {
        searchConditions.push({ id: parseInt(search) });
      }
      
      // Buscar por estado si coincide
      const estadosBusqueda = ['BORRADOR', 'ACTIVA'];
      const estadoMatch = estadosBusqueda.find(e => e.toLowerCase().includes(searchLower));
      if (estadoMatch) {
        searchConditions.push({ estado: estadoMatch });
      }
      
      whereClause[Op.or] = searchConditions;
    }

    // Primero obtenemos todas las encuestas que cumplan con los filtros básicos
    const encuestas = await Encuesta.findAll({
      where: whereClause,
      attributes: [
        'id', 'titulo', 'descripcion', 'estado', 'fecha_inicio', 'fecha_fin',
        'es_anonima', 'admin_creador_id', 'fecha_creacion', 'fecha_actualizacion'
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Contar el total sin duplicados
    const totalCount = await Encuesta.count({
      where: whereClause
    });

    // Contar respuestas para cada encuesta y obtener info del creador
    let encuestasConStats = await Promise.all(
      encuestas.map(async (encuesta) => {
        const totalRespuestas = await Respuesta.count({
          where: { encuesta_id: encuesta.id }
        });

        const totalPreguntas = await Pregunta.count({
          where: { 
            encuesta_id: encuesta.id,
            activo: true
          }
        });

        // Obtener información del admin creador
        const creador = await Admin.findByPk(encuesta.admin_creador_id, {
          attributes: ['id', 'nombre_usuario', 'apellido', 'email_usuario']
        });

        return {
          ...encuesta.toJSON(),
          total_respuestas: totalRespuestas,
          total_preguntas: totalPreguntas,
          creador: creador ? creador.toJSON() : null
        };
      })
    );

    // Filtrar por nombre del creador si hay búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      encuestasConStats = encuestasConStats.filter(encuesta => {
        // Ya cumple con los otros filtros, verificar si también coincide con creador
        if (encuesta.creador) {
          const nombreCompleto = `${encuesta.creador.nombre_usuario || ''} ${encuesta.creador.apellido || ''}`.toLowerCase();
          return nombreCompleto.includes(searchLower) ||
                 // Mantener si ya coincidió con otros campos
                 encuesta.titulo.toLowerCase().includes(searchLower) ||
                 (encuesta.descripcion && encuesta.descripcion.toLowerCase().includes(searchLower)) ||
                 encuesta.estado.toLowerCase().includes(searchLower) ||
                 encuesta.id.toString().includes(search);
        }
        return true; // Mantener encuestas sin creador si coinciden con otros campos
      });
    }

    res.json({
      ok: true,
      data: {
        encuestas: encuestasConStats,
        total: search ? encuestasConStats.length : totalCount,
        page: parseInt(page),
        totalPages: Math.ceil((search ? encuestasConStats.length : totalCount) / limit)
      }
    });

  } catch (error) {
    console.error('Error en obtenerEncuestas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener las encuestas'
    });
  }
};

// Obtener encuesta por ID con preguntas
const obtenerEncuestaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.usuario.id;

    const encuesta = await Encuesta.findOne({
      where: { 
        id: id,
        activo: true
      },
      include: [
        {
          model: Pregunta,
          as: 'preguntas',
          where: { activo: true },
          required: false,
          order: [['orden', 'ASC']]
        },
        {
          model: Admin,
          as: 'creador',
          attributes: ['id', 'nombre_usuario', 'apellido', 'email_usuario']
        }
      ],
      attributes: [
        'id', 'titulo', 'descripcion', 'estado', 'fecha_inicio', 'fecha_fin',
        'es_anonima', 'admin_creador_id', 'fecha_creacion', 'fecha_actualizacion'
      ]
    });

    if (!encuesta) {
      return res.status(404).json({
        ok: false,
        msj: 'Encuesta no encontrada'
      });
    }

    // Procesar las opciones y configuraciones para que sean objetos/arrays reales
    if (encuesta.preguntas) {
      encuesta.preguntas.forEach(pregunta => {
        if (pregunta.opciones && typeof pregunta.opciones === 'string') {
          try {
            pregunta.opciones = JSON.parse(pregunta.opciones);
          } catch (e) {
            // Si no es JSON válido, intentar separar por comas
            pregunta.opciones = pregunta.opciones.split(',').map(opt => opt.trim()).filter(opt => opt);
          }
        }
        
        if (pregunta.configuracion && typeof pregunta.configuracion === 'string') {
          try {
            pregunta.configuracion = JSON.parse(pregunta.configuracion);
          } catch (e) {
            pregunta.configuracion = {};
          }
        }
      });
    }

    res.json({
      ok: true,
      data: encuesta
    });

  } catch (error) {
    console.error('Error en obtenerEncuestaPorId:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener la encuesta'
    });
  }
};

// Actualizar encuesta
const actualizarEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titulo, 
      descripcion, 
      estado, 
      fecha_inicio, 
      fecha_fin, 
      es_anonima,
      preguntas 
    } = req.body;

    const adminId = req.usuario.id;

    // Permitir que cualquier admin pueda actualizar cualquier encuesta
    const encuesta = await Encuesta.findOne({
      where: { 
        id: id,
        activo: true
      }
    });

    if (!encuesta) {
      return res.status(404).json({
        ok: false,
        msj: 'Encuesta no encontrada'
      });
    }

    // Si la encuesta ya tiene respuestas, verificar si se están modificando las fechas
    const tieneRespuestas = await Respuesta.count({ where: { encuesta_id: id } });
    if (tieneRespuestas > 0 && estado === 'ACTIVA') {
      // Verificar si se están modificando las fechas de inicio o fin
      const fechaInicioCambiada = fecha_inicio && new Date(fecha_inicio).getTime() !== new Date(encuesta.fecha_inicio || 0).getTime();
      const fechaFinCambiada = fecha_fin && new Date(fecha_fin).getTime() !== new Date(encuesta.fecha_fin || 0).getTime();
      
      // Si no se están modificando las fechas, no permitir activar
      if (!fechaInicioCambiada && !fechaFinCambiada) {
        return res.status(400).json({
          ok: false,
          msj: 'No se puede activar una encuesta que ya tiene respuestas. Modifica las fechas de inicio o fin para permitir la activación.'
        });
      }
    }

    // Actualizar encuesta
    await encuesta.update({
      titulo: titulo?.trim() || encuesta.titulo,
      descripcion: descripcion?.trim() || encuesta.descripcion,
      estado: estado || encuesta.estado,
      fecha_inicio: fecha_inicio || encuesta.fecha_inicio,
      fecha_fin: fecha_fin || encuesta.fecha_fin,
      es_anonima: es_anonima !== undefined ? es_anonima : encuesta.es_anonima
    });

    // Si se proporcionan nuevas preguntas, actualizarlas
    if (preguntas && Array.isArray(preguntas)) {
      // Desactivar preguntas existentes
      await Pregunta.update(
        { activo: false },
        { where: { encuesta_id: id } }
      );

      // Crear nuevas preguntas
      for (let i = 0; i < preguntas.length; i++) {
        const pregunta = preguntas[i];
        await Pregunta.create({
          encuesta_id: id,
          texto: pregunta.texto.trim(),
          tipo: pregunta.tipo || 'TEXTO_CORTO',
          es_requerida: pregunta.es_requerida !== false,
          orden: i + 1,
          opciones: pregunta.opciones || null,
          configuracion: pregunta.configuracion || null
        });
      }
    }

    // Si se activa la encuesta, crear notificaciones
    if (estado === 'ACTIVA' && encuesta.estado !== 'ACTIVA') {
      const usuarios = await User.findAll({ 
        where: { activo: true },
        attributes: ['id']
      });

      const notificaciones = usuarios.map(usuario => ({
        usuario_id: usuario.id,
        encuesta_id: id,
        tipo: 'NUEVA_ENCUESTA',
        titulo: 'Nueva Encuesta Disponible',
        mensaje: `Tienes una nueva encuesta disponible: "${titulo || encuesta.titulo}".`,
        prioridad: 'MEDIA'
      }));

      await Notificacion.bulkCreate(notificaciones);
    }

    console.log(`Encuesta actualizada: ${titulo || encuesta.titulo} (ID: ${id})`);

    res.json({
      ok: true,
      msj: 'Encuesta actualizada correctamente'
    });

  } catch (error) {
    console.error('Error en actualizarEncuesta:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al actualizar la encuesta'
    });
  }
};

// Eliminar encuesta (soft delete)
const eliminarEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.usuario.id;

    // Permitir que cualquier admin elimine cualquier encuesta (super admin)
    const encuesta = await Encuesta.findOne({
      where: { 
        id: id,
        activo: true
      }
    });

    if (!encuesta) {
      return res.status(404).json({
        ok: false,
        msj: 'Encuesta no encontrada'
      });
    }

    // Verificar si tiene respuestas (solo para información)
    const tieneRespuestas = await Respuesta.count({ where: { encuesta_id: id } });
    let mensaje = 'Encuesta eliminada correctamente';
    
    if (tieneRespuestas > 0) {
      mensaje = `Encuesta eliminada correctamente (${tieneRespuestas} respuesta(s) preservadas)`;
    }

    // Soft delete
    await encuesta.update({
      activo: false,
      fecha_eliminacion: new Date()
    });

    console.log(`Encuesta eliminada: ${encuesta.titulo} (ID: ${id})`);

    res.json({
      ok: true,
      msj: mensaje,
      data: {
        tiene_respuestas: tieneRespuestas > 0,
        total_respuestas: tieneRespuestas
      }
    });

  } catch (error) {
    console.error('Error en eliminarEncuesta:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al eliminar la encuesta'
    });
  }
};

// Obtener encuestas eliminadas
const obtenerEncuestasEliminadas = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const adminId = req.usuario.id;

    const encuestas = await Encuesta.findAndCountAll({
      where: { 
        activo: false
      },
      attributes: [
        'id', 'titulo', 'descripcion', 'estado', 'fecha_eliminacion',
        'fecha_creacion', 'fecha_actualizacion'
      ],
      order: [['fecha_eliminacion', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      raw: true
    });

    res.json({
      ok: true,
      data: {
        encuestas: encuestas.rows,
        total: encuestas.count,
        page: parseInt(page),
        totalPages: Math.ceil(encuestas.count / limit)
      }
    });

  } catch (error) {
    console.error('Error en obtenerEncuestasEliminadas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener las encuestas eliminadas'
    });
  }
};

// Reactivar encuesta
const reactivarEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.usuario.id;

    // Permitir que cualquier admin pueda reactivar cualquier encuesta
    const encuesta = await Encuesta.findOne({
      where: { 
        id: id,
        activo: false
      }
    });

    if (!encuesta) {
      return res.status(404).json({
        ok: false,
        msj: 'Encuesta no encontrada'
      });
    }

    // Verificar si tiene respuestas y sesiones para información
    const tieneRespuestas = await Respuesta.count({ where: { encuesta_id: id } });
    const totalSesiones = await SesionEncuesta.count({ where: { encuesta_id: id } });

    // Reactivar la encuesta
    await encuesta.update({
      activo: true,
      fecha_eliminacion: null
    });

    // Reactivar las preguntas asociadas (por si algunas se desactivaron)
    await Pregunta.update(
      { activo: true },
      { where: { encuesta_id: id } }
    );

    let mensaje = 'Encuesta reactivada correctamente';
    if (tieneRespuestas > 0) {
      mensaje = `Encuesta reactivada correctamente (${tieneRespuestas} respuesta(s) y ${totalSesiones} sesión(es) restauradas)`;
    }

    console.log(`Encuesta reactivada: ${encuesta.titulo} (ID: ${id})`);

    res.json({
      ok: true,
      msj: mensaje,
      data: {
        tiene_respuestas: tieneRespuestas > 0,
        total_respuestas: tieneRespuestas,
        total_sesiones: totalSesiones
      }
    });

  } catch (error) {
    console.error('Error en reactivarEncuesta:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al reactivar la encuesta'
    });
  }
};

// Eliminar encuesta permanentemente
const eliminarEncuestaPermanentemente = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.usuario.id;

    // Permitir que cualquier admin elimine cualquier encuesta (super admin)
    const encuesta = await Encuesta.findOne({
      where: { 
        id: id,
        activo: false
      }
    });

    if (!encuesta) {
      return res.status(404).json({
        ok: false,
        msj: 'Encuesta no encontrada'
      });
    }

    // Verificar si tiene respuestas
    const tieneRespuestas = await Respuesta.count({ where: { encuesta_id: id } });
    const totalSesiones = await SesionEncuesta.count({ where: { encuesta_id: id } });
    const totalNotificaciones = await Notificacion.count({ where: { encuesta_id: id } });

    // El parámetro force_delete=true permite eliminar incluso con respuestas
    const forceDelete = req.query.force_delete === 'true';
    
    if (tieneRespuestas > 0 && !forceDelete) {
      return res.status(200).json({
        ok: false,
        msj: 'Esta encuesta tiene respuestas asociadas',
        requiere_confirmacion: true,
        data: {
          total_respuestas: tieneRespuestas,
          total_sesiones: totalSesiones,
          total_notificaciones: totalNotificaciones,
          mensaje_confirmacion: `Se eliminarán permanentemente: ${tieneRespuestas} respuesta(s), ${totalSesiones} sesión(es) y ${totalNotificaciones} notificación(es). Esta acción NO se puede deshacer.`
        }
      });
    }

    // Eliminar todos los datos relacionados en orden correcto
    console.log(`Eliminación permanente iniciada para encuesta: ${encuesta.titulo} (ID: ${id})`);
    
    // 1. Eliminar respuestas
    if (tieneRespuestas > 0) {
      await Respuesta.destroy({ where: { encuesta_id: id } });
      console.log(`- ${tieneRespuestas} respuestas eliminadas`);
    }
    
    // 2. Eliminar sesiones
    if (totalSesiones > 0) {
      await SesionEncuesta.destroy({ where: { encuesta_id: id } });
      console.log(`- ${totalSesiones} sesiones eliminadas`);
    }
    
    // 3. Eliminar notificaciones
    if (totalNotificaciones > 0) {
      await Notificacion.destroy({ where: { encuesta_id: id } });
      console.log(`- ${totalNotificaciones} notificaciones eliminadas`);
    }
    
    // 4. Eliminar preguntas
    await Pregunta.destroy({ where: { encuesta_id: id } });
    console.log(`- Preguntas eliminadas`);
    
    // 5. Eliminar encuesta
    await encuesta.destroy();
    console.log(`- Encuesta eliminada`);

    console.log(`Encuesta eliminada permanentemente: ${encuesta.titulo} (ID: ${id})`);

    res.json({
      ok: true,
      msj: 'Encuesta y todos sus datos asociados eliminados permanentemente',
      data: {
        respuestas_eliminadas: tieneRespuestas,
        sesiones_eliminadas: totalSesiones,
        notificaciones_eliminadas: totalNotificaciones
      }
    });

  } catch (error) {
    console.error('Error en eliminarEncuestaPermanentemente:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al eliminar la encuesta'
    });
  }
};

module.exports = {
  crearEncuesta,
  obtenerEncuestas,
  obtenerEncuestaPorId,
  actualizarEncuesta,
  eliminarEncuesta,
  obtenerEncuestasEliminadas,
  reactivarEncuesta,
  eliminarEncuestaPermanentemente
};

