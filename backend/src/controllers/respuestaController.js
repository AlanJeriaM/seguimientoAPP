const { Encuesta, Pregunta, Respuesta, SesionEncuesta, Notificacion, User } = require('../config/associations');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Obtener encuestas disponibles para el usuario
const obtenerEncuestasDisponibles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const usuarioId = req.usuario.id;

    const whereClause = {
      estado: 'ACTIVA',
      activo: true
    };

    if (search) {
      whereClause[Op.or] = [
        { titulo: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } }
      ];
    }

    const encuestas = await Encuesta.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'titulo', 'descripcion', 'tiempo_estimado', 'es_anonima',
        'permite_multiple_respuesta', 'fecha_inicio', 'fecha_fin'
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Verificar si el usuario ya respondió cada encuesta y su estado
    const encuestasConEstado = await Promise.all(
      encuestas.rows.map(async (encuesta) => {
        // Verificar sesión del usuario
        const sesion = await SesionEncuesta.findOne({
          where: {
            encuesta_id: encuesta.id,
            usuario_id: usuarioId
          },
          order: [['fecha_actualizacion', 'DESC']]
        });

        const yaRespondio = await Respuesta.findOne({
          where: {
            encuesta_id: encuesta.id,
            usuario_id: usuarioId
          },
          order: [['fecha_creacion', 'DESC']]
        });

        const totalPreguntas = await Pregunta.count({
          where: {
            encuesta_id: encuesta.id,
            activo: true
          }
        });

        const totalRespuestas = await Respuesta.count({
          where: {
            encuesta_id: encuesta.id,
            usuario_id: usuarioId
          }
        });

        // Determinar estado del usuario
        let estadoUsuario = 'NO_INICIADA';
        let progresoUsuario = 0;

        if (sesion) {
          console.log(`📋 Encuesta ${encuesta.id} - Sesión encontrada:`, {
            sesion_id: sesion.id,
            sesion_estado: sesion.estado,
            sesion_progreso: sesion.progreso,
            total_respuestas: totalRespuestas
          });
          
          if (sesion.estado === 'COMPLETADA') {
            estadoUsuario = 'COMPLETADA';
            progresoUsuario = 100;
          } else if (sesion.estado === 'EN_PROGRESO' && totalRespuestas > 0) {
            estadoUsuario = 'EN_PROGRESO';
            progresoUsuario = sesion.progreso || Math.round((totalRespuestas / totalPreguntas) * 100);
          }
          
          console.log(`  ➡️ Estado determinado: ${estadoUsuario} (${progresoUsuario}%)`);
        }

        return {
          ...encuesta.toJSON(),
          ya_respondida: !!yaRespondio,
          total_preguntas: totalPreguntas,
          ultima_respuesta: yaRespondio ? yaRespondio.fecha_creacion : null,
          estado_usuario: estadoUsuario,
          progreso: progresoUsuario
        };
      })
    );

    res.json({
      ok: true,
      data: {
        encuestas: encuestasConEstado,
        total: encuestas.count,
        page: parseInt(page),
        totalPages: Math.ceil(encuestas.count / limit)
      }
    });

  } catch (error) {
    console.error('Error en obtenerEncuestasDisponibles:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener las encuestas',
      error: error.message
    });
  }
};

// Obtener encuesta para responder
const obtenerEncuestaParaResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    // Verificar que la encuesta esté activa
    const encuesta = await Encuesta.findOne({
      where: {
        id: id,
        estado: 'ACTIVA',
        activo: true
      },
      include: [
        {
          model: Pregunta,
          as: 'preguntas',
          where: { activo: true },
          required: false,
          order: [['orden', 'ASC']],
          attributes: [
            'id', 'texto', 'tipo', 'es_requerida', 'orden',
            'opciones', 'configuracion'
          ]
        }
      ],
      attributes: [
        'id', 'titulo', 'descripcion', 'tiempo_estimado', 'es_anonima',
        'permite_multiple_respuesta', 'fecha_inicio', 'fecha_fin'
      ]
    });

    if (!encuesta) {
      return res.status(404).json({
        ok: false,
        msj: 'Encuesta no encontrada o no está disponible'
      });
    }

    // Verificar sesión existente
    const sesion = await SesionEncuesta.findOne({
      where: {
        encuesta_id: id,
        usuario_id: usuarioId
      }
    });

    // Solo bloquear si la sesión está COMPLETADA
    if (sesion && sesion.estado === 'COMPLETADA' && !encuesta.permite_multiple_respuesta) {
      return res.status(400).json({
        ok: false,
        msj: 'Ya has completado esta encuesta'
      });
    }

    // Crear sesión si no existe, o usar la existente
    let sesionActual = sesion;
    if (!sesionActual) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      sesionActual = await SesionEncuesta.create({
        encuesta_id: id,
        usuario_id: usuarioId,
        session_token: sessionToken,
        estado: 'INICIADA',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    }

    // Verificar si ya respondió (para información)
    const yaRespondio = await Respuesta.findOne({
      where: {
        encuesta_id: id,
        usuario_id: usuarioId
      }
    });

    // Procesar las opciones para que sean arrays reales
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

    // Obtener respuestas guardadas si existen (para reanudar)
    const respuestasGuardadas = await Respuesta.findAll({
      where: {
        encuesta_id: id,
        usuario_id: usuarioId
      },
      attributes: ['pregunta_id', 'respuesta']
    });

    // Marcar notificación como leída
    await Notificacion.update(
      { leida: true, fecha_leida: new Date() },
      {
        where: {
          usuario_id: usuarioId,
          encuesta_id: id,
          tipo: 'NUEVA_ENCUESTA'
        }
      }
    );

    res.json({
      ok: true,
      data: {
        encuesta,
        session_token: sesionActual.session_token,
        ya_respondida: !!yaRespondio,
        progreso_guardado: {
          progreso: sesionActual.progreso || 0,
          pregunta_actual: sesionActual.pregunta_actual || 0,
          respuestas: respuestasGuardadas.map(r => ({
            pregunta_id: r.pregunta_id,
            respuesta: r.respuesta
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error en obtenerEncuestaParaResponder:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener la encuesta'
    });
  }
};

// Enviar respuestas de la encuesta
const enviarRespuestas = async (req, res) => {
  try {
    const { id } = req.params;
    const { respuestas, session_token } = req.body;
    const usuarioId = req.usuario.id;

    // Validar campos requeridos
    if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
      return res.status(400).json({
        ok: false,
        msj: 'Las respuestas son obligatorias'
      });
    }

    // Verificar que la encuesta esté activa
    const encuesta = await Encuesta.findOne({
      where: {
        id: id,
        estado: 'ACTIVA',
        activo: true
      },
      include: [
        {
          model: Pregunta,
          as: 'preguntas',
          where: { activo: true },
          required: false,
          attributes: ['id', 'texto', 'tipo', 'es_requerida']
        }
      ]
    });

    if (!encuesta) {
      return res.status(404).json({
        ok: false,
        msj: 'Encuesta no encontrada o no está disponible'
      });
    }

    // Verificar sesión
    const sesion = await SesionEncuesta.findOne({
      where: {
        encuesta_id: id,
        usuario_id: usuarioId,
        session_token: session_token
      }
    });

    if (!sesion) {
      return res.status(400).json({
        ok: false,
        msj: 'Sesión de encuesta inválida'
      });
    }

    // Verificar si ya completó la encuesta (si no permite múltiples respuestas)
    if (!encuesta.permite_multiple_respuesta && sesion.estado === 'COMPLETADA') {
      return res.status(400).json({
        ok: false,
        msj: 'Ya has completado esta encuesta'
      });
    }

    // Validar que todas las preguntas requeridas tengan respuesta
    const preguntasRequeridas = encuesta.preguntas.filter(p => p.es_requerida);
    const preguntasRespondidas = respuestas.map(r => r.pregunta_id);

    for (const pregunta of preguntasRequeridas) {
      if (!preguntasRespondidas.includes(pregunta.id)) {
        return res.status(400).json({
          ok: false,
          msj: `La pregunta "${pregunta.texto}" es obligatoria`
        });
      }
    }

    // Calcular tiempo de respuesta
    const tiempoRespuesta = Math.floor((Date.now() - new Date(sesion.fecha_inicio)) / 1000);

    // Eliminar respuestas anteriores (del progreso guardado) para evitar duplicados
    await Respuesta.destroy({
      where: {
        encuesta_id: id,
        usuario_id: usuarioId
      }
    });

    console.log('🗑️ Respuestas anteriores eliminadas, guardando respuestas finales...');

    // Guardar respuestas finales
    const respuestasGuardadas = [];
    for (const respuesta of respuestas) {
      const pregunta = encuesta.preguntas.find(p => p.id === respuesta.pregunta_id);
      if (pregunta) {
        const respuestaGuardada = await Respuesta.create({
          encuesta_id: id,
          pregunta_id: respuesta.pregunta_id,
          usuario_id: usuarioId,
          respuesta: respuesta.respuesta,
          tiempo_respuesta: tiempoRespuesta,
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
        respuestasGuardadas.push(respuestaGuardada);
      }
    }

    console.log(`✅ ${respuestasGuardadas.length} respuestas finales guardadas`);


    // Actualizar sesión
    await sesion.update({
      estado: 'COMPLETADA',
      fecha_fin: new Date(),
      tiempo_total: tiempoRespuesta,
      progreso: 100
    });

    // Crear notificación de encuesta completada
    await Notificacion.create({
      usuario_id: usuarioId,
      encuesta_id: id,
      tipo: 'ENCUESTA_COMPLETADA',
      titulo: 'Encuesta Completada',
      mensaje: `Has completado exitosamente la encuesta "${encuesta.titulo}". ¡Gracias por tu participación!`,
      prioridad: 'BAJA'
    });

    console.log(`Encuesta completada por usuario ${usuarioId}: ${encuesta.titulo} (${respuestasGuardadas.length} respuestas)`);

    res.json({
      ok: true,
      msj: 'Encuesta completada correctamente',
      data: {
        encuesta_id: id,
        total_respuestas: respuestasGuardadas.length,
        tiempo_respuesta: tiempoRespuesta
      }
    });

  } catch (error) {
    console.error('Error en enviarRespuestas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al enviar las respuestas'
    });
  }
};

// Guardar progreso de encuesta (sin completarla)
const guardarProgresoEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const { respuestas, session_token, pregunta_actual, progreso } = req.body;
    const usuarioId = req.usuario.id;

    console.log('🔵 guardarProgresoEncuesta - Inicio');
    console.log('  - Encuesta ID:', id);
    console.log('  - Usuario ID:', usuarioId);
    console.log('  - Progreso recibido:', progreso);
    console.log('  - Pregunta actual:', pregunta_actual);
    console.log('  - Total respuestas:', respuestas?.length);

    // Verificar que la encuesta esté activa
    const encuesta = await Encuesta.findOne({
      where: {
        id: id,
        estado: 'ACTIVA',
        activo: true
      }
    });

    if (!encuesta) {
      return res.status(404).json({
        ok: false,
        msj: 'Encuesta no encontrada o no está disponible'
      });
    }

    // Buscar o crear sesión
    let sesion = await SesionEncuesta.findOne({
      where: {
        encuesta_id: id,
        usuario_id: usuarioId
      }
    });

    // Verificar si la sesión está completada
    if (sesion && sesion.estado === 'COMPLETADA') {
      return res.status(400).json({
        ok: false,
        msj: 'Esta encuesta ya ha sido completada'
      });
    }

    // Crear sesión si no existe
    if (!sesion) {
      sesion = await SesionEncuesta.create({
        encuesta_id: id,
        usuario_id: usuarioId,
        session_token: session_token || crypto.randomBytes(32).toString('hex'),
        fecha_inicio: new Date(),
        estado: 'EN_PROGRESO',
        progreso: 0,
        pregunta_actual: 0
      });
      console.log('✅ Sesión creada con estado EN_PROGRESO:', sesion.id);
    }

    // Guardar/actualizar respuestas (sin marcar como completadas)
    if (respuestas && Array.isArray(respuestas) && respuestas.length > 0) {
      let respuestasCreadas = 0;
      let respuestasActualizadas = 0;
      
      for (const respuesta of respuestas) {
        // Verificar si ya existe una respuesta para esta pregunta
        const respuestaExistente = await Respuesta.findOne({
          where: {
            encuesta_id: id,
            pregunta_id: respuesta.pregunta_id,
            usuario_id: usuarioId
          }
        });

        if (respuestaExistente) {
          // Actualizar respuesta existente
          await respuestaExistente.update({
            respuesta: respuesta.respuesta,
            fecha_respuesta: new Date()
          });
          respuestasActualizadas++;
        } else {
          // Crear nueva respuesta
          await Respuesta.create({
            encuesta_id: id,
            pregunta_id: respuesta.pregunta_id,
            usuario_id: usuarioId,
            respuesta: respuesta.respuesta,
            tiempo_respuesta: Math.floor((Date.now() - new Date(sesion.fecha_inicio)) / 1000),
            ip_address: req.ip
          });
          respuestasCreadas++;
        }
      }
      
      console.log(`💾 Respuestas guardadas: ${respuestasCreadas} nuevas, ${respuestasActualizadas} actualizadas`);
    }

    // Recalcular el progreso real basado en las respuestas guardadas en BD
    const totalPreguntasEncuesta = await Pregunta.count({
      where: {
        encuesta_id: id,
        activo: true
      }
    });

    const totalRespuestasGuardadas = await Respuesta.count({
      where: {
        encuesta_id: id,
        usuario_id: usuarioId
      }
    });

    const progresoReal = totalPreguntasEncuesta > 0 
      ? Math.round((totalRespuestasGuardadas / totalPreguntasEncuesta) * 100) 
      : 0;

    console.log(`📊 Progreso recalculado: ${totalRespuestasGuardadas}/${totalPreguntasEncuesta} = ${progresoReal}%`);

    // Actualizar sesión con el progreso real
    await sesion.update({
      estado: 'EN_PROGRESO',
      progreso: progresoReal,
      pregunta_actual: pregunta_actual !== undefined ? pregunta_actual : sesion.pregunta_actual,
      fecha_actualizacion: new Date()
    });

    // Recargar sesión para confirmar el estado
    await sesion.reload();
    console.log('📊 Estado final de la sesión:', {
      id: sesion.id,
      estado: sesion.estado,
      progreso: sesion.progreso,
      pregunta_actual: sesion.pregunta_actual
    });

    res.json({
      ok: true,
      msj: 'Progreso guardado correctamente',
      data: {
        sesion_id: sesion.id,
        estado: sesion.estado,
        progreso: sesion.progreso,
        pregunta_actual: sesion.pregunta_actual
      }
    });

  } catch (error) {
    console.error('Error en guardarProgresoEncuesta:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al guardar el progreso'
    });
  }
};

// Obtener historial de encuestas respondidas
const obtenerHistorialEncuestas = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const usuarioId = req.usuario.id;

    // Obtener encuestas respondidas
    const respuestas = await Respuesta.findAndCountAll({
      where: { usuario_id: usuarioId },
      include: [
        {
          model: Encuesta,
          as: 'encuesta',
          attributes: ['id', 'titulo', 'descripcion', 'estado']
        },
        {
          model: Pregunta,
          as: 'pregunta',
          attributes: ['id', 'texto', 'tipo']
        }
      ],
      attributes: ['id', 'respuesta', 'fecha_respuesta', 'tiempo_respuesta'],
      order: [['fecha_respuesta', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      raw: true
    });

    // Agrupar por encuesta
    const encuestasRespondidas = {};
    respuestas.rows.forEach(respuesta => {
      const encuestaId = respuesta['encuesta.id'];
      if (!encuestasRespondidas[encuestaId]) {
        encuestasRespondidas[encuestaId] = {
          id: encuestaId,
          titulo: respuesta['encuesta.titulo'],
          descripcion: respuesta['encuesta.descripcion'],
          estado: respuesta['encuesta.estado'],
          fecha_respuesta: respuesta.fecha_respuesta,
          total_preguntas: 0,
          respuestas: []
        };
      }
      encuestasRespondidas[encuestaId].respuestas.push({
        pregunta: respuesta['pregunta.texto'],
        respuesta: respuesta.respuesta,
        tipo: respuesta['pregunta.tipo']
      });
      encuestasRespondidas[encuestaId].total_preguntas++;
    });

    const historial = Object.values(encuestasRespondidas);

    res.json({
      ok: true,
      data: {
        historial,
        total: respuestas.count,
        page: parseInt(page),
        totalPages: Math.ceil(respuestas.count / limit)
      }
    });

  } catch (error) {
    console.error('Error en obtenerHistorialEncuestas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener el historial'
    });
  }
};

// Obtener notificaciones del usuario
const obtenerNotificaciones = async (req, res) => {
  try {
    const { page = 1, limit = 20, no_leidas } = req.query;
    const offset = (page - 1) * limit;
    const usuarioId = req.usuario.id;

    const whereClause = {
      usuario_id: usuarioId,
      activo: true
    };

    if (no_leidas === 'true') {
      whereClause.leida = false;
    }

    const notificaciones = await Notificacion.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'tipo', 'titulo', 'mensaje', 'leida', 'fecha_leida',
        'prioridad', 'fecha_creacion'
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      raw: true
    });

    res.json({
      ok: true,
      data: {
        notificaciones: notificaciones.rows,
        total: notificaciones.count,
        page: parseInt(page),
        totalPages: Math.ceil(notificaciones.count / limit)
      }
    });

  } catch (error) {
    console.error('Error en obtenerNotificaciones:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener las notificaciones'
    });
  }
};

// Marcar notificación como leída
const marcarNotificacionLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const notificacion = await Notificacion.findOne({
      where: {
        id: id,
        usuario_id: usuarioId,
        activo: true
      }
    });

    if (!notificacion) {
      return res.status(404).json({
        ok: false,
        msj: 'Notificación no encontrada'
      });
    }

    await notificacion.update({
      leida: true,
      fecha_leida: new Date()
    });

    res.json({
      ok: true,
      msj: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error en marcarNotificacionLeida:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al marcar la notificación'
    });
  }
};

module.exports = {
  obtenerEncuestasDisponibles,
  obtenerEncuestaParaResponder,
  enviarRespuestas,
  guardarProgresoEncuesta,
  obtenerHistorialEncuestas,
  obtenerNotificaciones,
  marcarNotificacionLeida
};

