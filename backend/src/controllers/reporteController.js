const { Encuesta, Pregunta, Respuesta, SesionEncuesta, User } = require('../config/associations');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Obtener estadísticas generales de encuestas
const obtenerEstadisticasGenerales = async (req, res) => {
  try {
    const adminId = req.usuario.id;

    // Estadísticas básicas
    const totalEncuestas = await Encuesta.count({
      where: { 
        activo: true
      }
    });

    // Obtener todas las encuestas para calcular estados dinámicos
    const todasEncuestas = await Encuesta.findAll({
      where: { 
        activo: true
      },
      attributes: ['id', 'estado', 'fecha_inicio', 'fecha_fin']
    });

    // Calcular estados dinámicos
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let encuestasActivas = 0;
    let encuestasProximamente = 0;
    let encuestasExpiradas = 0;
    let encuestasBorrador = 0;

    todasEncuestas.forEach(encuesta => {
      // Verificar si está expirada
      if (encuesta.fecha_fin) {
        const fechaFin = new Date(encuesta.fecha_fin);
        fechaFin.setHours(23, 59, 59, 999);
        
        if (fechaFin < hoy) {
          encuestasExpiradas++;
          return;
        }
      }

      // Verificar si es próximamente (solo para ACTIVA)
      if (encuesta.estado === 'ACTIVA' && encuesta.fecha_inicio) {
        const fechaInicio = new Date(encuesta.fecha_inicio);
        fechaInicio.setHours(0, 0, 0, 0);
        
        if (fechaInicio > hoy) {
          encuestasProximamente++;
          return;
        }
      }

      // Contar por estado base
      if (encuesta.estado === 'ACTIVA') {
        encuestasActivas++;
      } else if (encuesta.estado === 'BORRADOR') {
        encuestasBorrador++;
      }
    });

    const totalPreguntas = await Pregunta.count({
      include: [{
        model: Encuesta,
        as: 'encuesta',
        where: { 
          activo: true
        }
      }],
      where: { activo: true }
    });

    const totalRespuestas = await Respuesta.count({
      include: [{
        model: Encuesta,
        as: 'encuesta',
        where: { 
          activo: true
        }
      }]
    });

    const totalUsuarios = await User.count({
      where: { activo: true }
    });

    // Usuarios que han respondido al menos una encuesta
    const usuariosActivos = await Respuesta.count({
      include: [{
        model: Encuesta,
        as: 'encuesta',
        where: { 
          activo: true
        }
      }],
      distinct: true,
      col: 'usuario_id'
    });

    // Tasa de participación
    const tasaParticipacion = totalUsuarios > 0 ? (usuariosActivos / totalUsuarios * 100).toFixed(2) : 0;

    // Tiempo promedio de respuesta
    const tiempoPromedio = await Respuesta.findOne({
      include: [{
        model: Encuesta,
        as: 'encuesta',
        where: { 
          activo: true
        }
      }],
      attributes: [
        [sequelize.fn('AVG', sequelize.col('tiempo_respuesta')), 'tiempo_promedio']
      ],
      raw: true
    });

    const tiempoPromedioSegundos = tiempoPromedio?.tiempo_promedio || 0;
    const tiempoPromedioMinutos = Math.round(tiempoPromedioSegundos / 60);

    res.json({
      ok: true,
      data: {
        total_encuestas: totalEncuestas,
        encuestas_activas: encuestasActivas,
        encuestas_proximamente: encuestasProximamente,
        encuestas_expiradas: encuestasExpiradas,
        encuestas_borrador: encuestasBorrador,
        total_preguntas: totalPreguntas,
        total_respuestas: totalRespuestas,
        total_usuarios: totalUsuarios,
        usuarios_activos: usuariosActivos,
        tasa_participacion: parseFloat(tasaParticipacion),
        tiempo_promedio_minutos: tiempoPromedioMinutos
      }
    });

  } catch (error) {
    console.error('Error en obtenerEstadisticasGenerales:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener las estadísticas'
    });
  }
};

// Obtener reporte detallado de una encuesta
const obtenerReporteEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.usuario.id;

    // Permitir que cualquier admin acceda a cualquier encuesta
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
        }
      ]
    });

    if (!encuesta) {
      return res.status(404).json({
        ok: false,
        msj: 'Encuesta no encontrada'
      });
    }

    // Obtener estadísticas de respuestas por pregunta
    const reportePreguntas = await Promise.all(
      encuesta.preguntas.map(async (pregunta) => {
        const respuestas = await Respuesta.findAll({
          where: { pregunta_id: pregunta.id },
          attributes: ['respuesta', 'fecha_respuesta', 'tiempo_respuesta', 'usuario_id']
        });

        // Parse opciones if they are stored as JSON string
        let opcionesDisponibles = [];
        if (pregunta.opciones) {
          if (typeof pregunta.opciones === 'string') {
            try {
              opcionesDisponibles = JSON.parse(pregunta.opciones);
            } catch (e) {
              opcionesDisponibles = pregunta.opciones.split(',').map(opt => opt.trim()).filter(opt => opt);
            }
          } else if (Array.isArray(pregunta.opciones)) {
            opcionesDisponibles = pregunta.opciones;
          }
        }

        let analisis = {};
        
        switch (pregunta.tipo) {
          case 'OPCION_UNICA':
          case 'OPCION_MULTIPLE':
            // Contar opciones seleccionadas con texto completo
            const opcionesCount = {};
            respuestas.forEach(resp => {
              const indices = resp.respuesta.split(',').map(o => o.trim());
              indices.forEach(indice => {
                // Convertir índice a texto de opción
                const indiceNum = parseInt(indice);
                let textoOpcion = indice; // Por defecto usar el índice
                
                if (!isNaN(indiceNum) && opcionesDisponibles[indiceNum - 1]) {
                  // Si es un índice válido, usar el texto
                  textoOpcion = opcionesDisponibles[indiceNum - 1];
                } else if (opcionesDisponibles.includes(indice)) {
                  // Si ya es texto completo
                  textoOpcion = indice;
                }
                
                opcionesCount[textoOpcion] = (opcionesCount[textoOpcion] || 0) + 1;
              });
            });
            analisis = { 
              opciones_count: opcionesCount,
              opciones_disponibles: opcionesDisponibles 
            };
            break;
          
          case 'ESCALA':
            // Calcular promedio y distribución
            const valores = respuestas.map(r => parseInt(r.respuesta)).filter(v => !isNaN(v));
            const promedio = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
            analisis = { 
              promedio: Math.round(promedio * 100) / 100,
              total_valores: valores.length
            };
            break;
          
          case 'TEXTO_CORTO':
          case 'TEXTO_LARGO':
            // Contar respuestas únicas y mostrar las más comunes
            const respuestasTexto = respuestas.map(r => r.respuesta).filter(r => r && r.trim());
            const respuestasUnicas = [...new Set(respuestasTexto)];
            
            // Contar frecuencia de respuestas para mostrar las más comunes
            const frecuenciaTexto = {};
            respuestasTexto.forEach(resp => {
              frecuenciaTexto[resp] = (frecuenciaTexto[resp] || 0) + 1;
            });
            
            // Obtener top 10 respuestas más frecuentes
            const topRespuestas = Object.entries(frecuenciaTexto)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([respuesta, count]) => ({ respuesta, count }));
            
            analisis = { 
              respuestas_unicas: respuestasUnicas.length,
              total_respuestas: respuestas.length,
              top_respuestas: topRespuestas,
              todas_respuestas: respuestasTexto.slice(0, 50) // Máximo 50 para no sobrecargar
            };
            break;
          
          case 'FECHA':
            // Análisis de fechas
            const fechas = respuestas.map(r => r.respuesta).filter(f => f);
            const fechasUnicas = [...new Set(fechas)];
            
            analisis = {
              total_respuestas: respuestas.length,
              fechas_unicas: fechasUnicas.length,
              fechas_proporcionadas: fechas
            };
            break;
          
          case 'NUMERO':
            // Análisis numérico
            const numeros = respuestas.map(r => parseFloat(r.respuesta)).filter(n => !isNaN(n));
            const promedioNumeros = numeros.length > 0 ? numeros.reduce((a, b) => a + b, 0) / numeros.length : 0;
            const minimo = numeros.length > 0 ? Math.min(...numeros) : 0;
            const maximo = numeros.length > 0 ? Math.max(...numeros) : 0;
            
            analisis = {
              total_respuestas: respuestas.length,
              promedio: Math.round(promedioNumeros * 100) / 100,
              minimo,
              maximo,
              valores_validos: numeros.length
            };
            break;
          
          default:
            analisis = { 
              total_respuestas: respuestas.length,
              respuestas_muestra: respuestas.slice(0, 10).map(r => r.respuesta)
            };
        }

        return {
          id: pregunta.id,
          texto: pregunta.texto,
          tipo: pregunta.tipo,
          es_requerida: pregunta.es_requerida,
          orden: pregunta.orden,
          total_respuestas: respuestas.length,
          analisis: analisis,
          opciones: pregunta.opciones
        };
      })
    );

    // Estadísticas generales de la encuesta
    const totalRespuestas = await Respuesta.count({
      where: { encuesta_id: id }
    });

    const usuariosUnicos = await Respuesta.count({
      where: { encuesta_id: id },
      distinct: true,
      col: 'usuario_id'
    });

    const tiempoPromedio = await Respuesta.findOne({
      where: { encuesta_id: id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('tiempo_respuesta')), 'tiempo_promedio']
      ],
      raw: true
    });

    const tiempoPromedioSegundos = tiempoPromedio?.tiempo_promedio || 0;
    const tiempoPromedioMinutos = Math.round(tiempoPromedioSegundos / 60);

    res.json({
      ok: true,
      data: {
        encuesta: {
          id: encuesta.id,
          titulo: encuesta.titulo,
          descripcion: encuesta.descripcion,
          estado: encuesta.estado,
          fecha_creacion: encuesta.fecha_creacion,
          tiempo_estimado: encuesta.tiempo_estimado
        },
        estadisticas: {
          total_respuestas: totalRespuestas,
          usuarios_unicos: usuariosUnicos,
          tiempo_promedio_minutos: tiempoPromedioMinutos,
          tasa_completacion: totalRespuestas > 0 ? (usuariosUnicos / totalRespuestas * 100).toFixed(2) : 0
        },
        preguntas: reportePreguntas
      }
    });

  } catch (error) {
    console.error('Error en obtenerReporteEncuesta:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener el reporte'
    });
  }
};

// Exportar datos de encuesta (CSV)
const exportarDatosEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.usuario.id;

    // Permitir que cualquier admin acceda a cualquier encuesta
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

    // Obtener todas las respuestas con datos de usuario y pregunta
    const respuestas = await Respuesta.findAll({
      where: { encuesta_id: id },
      include: [
        {
          model: User,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'correo']
        },
        {
          model: Pregunta,
          as: 'pregunta',
          attributes: ['texto', 'tipo', 'orden']
        }
      ],
      order: [
        ['usuario_id', 'ASC'],
        ['pregunta_id', 'ASC']
      ],
      raw: true
    });

    // Formatear datos para CSV
    const datosCSV = respuestas.map(respuesta => ({
      usuario_id: respuesta['usuario.id'],
      nombre: respuesta['usuario.nombre'],
      apellido: respuesta['usuario.apellido'],
      correo: respuesta['usuario.correo'],
      pregunta_id: respuesta['pregunta.id'],
      pregunta_texto: respuesta['pregunta.texto'],
      pregunta_tipo: respuesta['pregunta.tipo'],
      pregunta_orden: respuesta['pregunta.orden'],
      respuesta: respuesta.respuesta,
      fecha_respuesta: respuesta.fecha_respuesta,
      tiempo_respuesta: respuesta.tiempo_respuesta
    }));

    res.json({
      ok: true,
      data: {
        encuesta: {
          id: encuesta.id,
          titulo: encuesta.titulo
        },
        total_respuestas: datosCSV.length,
        datos: datosCSV
      }
    });

  } catch (error) {
    console.error('Error en exportarDatosEncuesta:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al exportar los datos'
    });
  }
};

module.exports = {
  obtenerEstadisticasGenerales,
  obtenerReporteEncuesta,
  exportarDatosEncuesta
};

