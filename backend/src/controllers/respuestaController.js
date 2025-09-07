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

    // Verificar si el usuario ya respondió cada encuesta
    const encuestasConEstado = await Promise.all(
      encuestas.rows.map(async (encuesta) => {
        const yaRespondio = await Respuesta.findOne({
          where: { 
            encuesta_id: encuesta.id,
            usuario_id: usuarioId
          }
        });

        const totalPreguntas = await Pregunta.count({
          where: { 
            encuesta_id: encuesta.id,
            activo: true
          }
        });

        return {
          ...encuesta.toJSON(),
          ya_respondida: !!yaRespondio,
          total_preguntas: totalPreguntas
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

    // Verificar si ya respondió
    const yaRespondio = await Respuesta.findOne({
      where: { 
        encuesta_id: id,
        usuario_id: usuarioId
      }
    });

    if (yaRespondio && !encuesta.permite_multiple_respuesta) {
      return res.status(400).json({
        ok: false,
        msj: 'Ya has respondido esta encuesta'
      });
    }

    // Crear o actualizar sesión
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const [sesion] = await SesionEncuesta.findOrCreate({
      where: { 
        encuesta_id: id,
        usuario_id: usuarioId
      },
      defaults: {
        session_token: sessionToken,
        estado: 'INICIADA',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }
    });

    if (sesion.estado === 'COMPLETADA' && !encuesta.permite_multiple_respuesta) {
      return res.status(400).json({
        ok: false,
        msj: 'Ya has completado esta encuesta'
      });
    }

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
        session_token: sesion.session_token,
        ya_respondida: !!yaRespondio
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

    // Verificar si ya respondió (si no permite múltiples respuestas)
    if (!encuesta.permite_multiple_respuesta) {
      const yaRespondio = await Respuesta.findOne({
        where: { 
          encuesta_id: id,
          usuario_id: usuarioId
        }
      });

      if (yaRespondio) {
        return res.status(400).json({
          ok: false,
          msj: 'Ya has respondido esta encuesta'
        });
      }
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

    // Guardar respuestas
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
  obtenerHistorialEncuestas,
  obtenerNotificaciones,
  marcarNotificacionLeida
};

