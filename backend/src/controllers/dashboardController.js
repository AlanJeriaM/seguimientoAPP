const User = require('../models/User');
const { Op } = require('sequelize');

// Obtener estadísticas generales del mercado laboral
const obtenerEstadisticasMercado = async (req, res) => {
  try {
    // Total de profesionales en la plataforma
    const totalProfesionales = await User.count({ 
      where: { 
        activo: true,
        posicion_actual: {
          [Op.and]: [
            { [Op.not]: null },
            { [Op.ne]: '' },
            { [Op.ne]: 'No especificada' }
          ]
        }
      }
    });

    // Nuevos registros este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const nuevosProfesionalesEsteMes = await User.count({
      where: {
        activo: true,
        created_at: {
          [Op.gte]: inicioMes
        }
      }
    });

    // Total de empresas diferentes en la plataforma
    const empresasUnicas = await User.count({
      distinct: true,
      col: 'empresa_actual',
      where: {
        activo: true,
        empresa_actual: {
          [Op.and]: [
            { [Op.not]: null },
            { [Op.ne]: '' },
            { [Op.ne]: 'No especificada' }
          ]
        }
      }
    });

    // Total de industrias diferentes
    const industriasUnicas = await User.count({
      distinct: true,
      col: 'industria',
      where: {
        activo: true,
        industria: {
          [Op.and]: [
            { [Op.not]: null },
            { [Op.ne]: '' },
            { [Op.ne]: 'No especificada' }
          ]
        }
      }
    });

    res.json({
      ok: true,
      estadisticas: {
        totalProfesionales,
        nuevosProfesionalesEsteMes,
        empresasUnicas,
        industriasUnicas,
        porcentajeCrecimiento: totalProfesionales > 0 ? 
          Math.round((nuevosProfesionalesEsteMes / totalProfesionales) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error en obtenerEstadisticasMercado:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener estadísticas del mercado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener distribución de tecnologías/skills más demandadas
const obtenerTecnologiasMasDemandadas = async (req, res) => {
  try {
    // Simular análisis de palabras clave en posiciones actuales
    const posiciones = await User.findAll({
      where: {
        activo: true,
        posicion_actual: {
          [Op.and]: [
            { [Op.not]: null },
            { [Op.ne]: '' },
            { [Op.ne]: 'No especificada' }
          ]
        }
      },
      attributes: ['posicion_actual'],
      raw: true
    });

    // Palabras clave tecnológicas comunes
    const tecnologias = [
      'JavaScript', 'Python', 'Java', 'React', 'Angular', 'Node.js',
      'TypeScript', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker',
      'Git', 'Kubernetes', 'Vue.js', 'PHP', 'C#', '.NET', 'Go', 'Rust'
    ];

    const conteoTecnologias = {};
    tecnologias.forEach(tech => conteoTecnologias[tech] = 0);

    // Contar ocurrencias en posiciones
    posiciones.forEach(pos => {
      const posicion = pos.posicion_actual.toLowerCase();
      tecnologias.forEach(tech => {
        if (posicion.includes(tech.toLowerCase())) {
          conteoTecnologias[tech]++;
        }
      });
    });

    // Convertir a array y ordenar
    const tecnologiasOrdenadas = Object.entries(conteoTecnologias)
      .map(([nombre, demanda]) => ({ nombre, demanda }))
      .sort((a, b) => b.demanda - a.demanda)
      .slice(0, 15); // Top 15

    res.json({
      ok: true,
      tecnologias: tecnologiasOrdenadas
    });

  } catch (error) {
    console.error('Error en obtenerTecnologiasMasDemandadas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error al obtener tecnologías más demandadas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener distribución salarial por industria (simulada)
const obtenerDistribucionSalarial = async (req, res) => {
  try {
    const industriasConUsuarios = await User.findAll({
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
      limit: 8,
      raw: true
    });

    // Simular rangos salariales para cada industria
    const rangosBaseSalarial = {
      'Tecnología': { min: 1800000, max: 4500000, promedio: 2800000 },
      'Servicios financieros': { min: 2000000, max: 5000000, promedio: 3200000 },
      'Consultoría': { min: 1600000, max: 4000000, promedio: 2600000 },
      'Educación': { min: 1200000, max: 2800000, promedio: 1800000 },
      'Salud': { min: 1500000, max: 3500000, promedio: 2200000 },
      'Retail': { min: 1000000, max: 2500000, promedio: 1600000 },
      'Manufactura': { min: 1300000, max: 3000000, promedio: 2000000 },
      'Default': { min: 1400000, max: 3200000, promedio: 2100000 }
    };

    const distribucionSalarial = industriasConUsuarios.map(item => {
      const industria = item.industria;
      const cantidad = parseInt(item.cantidad);
      const rango = rangosBaseSalarial[industria] || rangosBaseSalarial['Default'];
      
      return {
        industria,
        cantidad,
        salarioMinimo: rango.min,
        salarioMaximo: rango.max,
        salarioPromedio: rango.promedio,
        // Simular variaciones
        variacionMensual: Math.round((Math.random() - 0.5) * 10) // +/- 5%
      };
    });

    res.json({
      ok: true,
      distribucionSalarial
    });

  } catch (error) {
    console.error('Error en obtenerDistribucionSalarial:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error al obtener distribución salarial',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener empresas que más contratan
const obtenerEmpresasQueContratanMas = async (req, res) => {
  try {
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
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'totalEmpleados']
      ],
      group: ['empresa_actual'],
      order: [[User.sequelize.fn('COUNT', User.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Simular datos adicionales para cada empresa
    const empresasConDetalles = empresasMasComunes.map(emp => {
      const totalEmpleados = parseInt(emp.totalEmpleados);
      return {
        empresa: emp.empresa_actual,
        totalEmpleados,
        // Simular datos adicionales
        vacantesAbiertas: Math.round(totalEmpleados * 0.15), // 15% aproximado
        promedioSalario: 2000000 + (Math.random() * 1500000), // Entre 2M y 3.5M
        satisfaccionLaboral: 3.5 + (Math.random() * 1.5), // Entre 3.5 y 5.0
        tipoEmpresa: totalEmpleados > 5 ? 'Grande' : totalEmpleados > 2 ? 'Mediana' : 'Pequeña'
      };
    });

    res.json({
      ok: true,
      empresas: empresasConDetalles
    });

  } catch (error) {
    console.error('Error en obtenerEmpresasQueContratanMas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error al obtener empresas que más contratan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener tendencias del mercado laboral
const obtenerTendenciasMercado = async (req, res) => {
  try {
    // Obtener datos de los últimos 6 meses
    const meses = [];
    const fechaActual = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const siguienteMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i + 1, 1);
      
      const registros = await User.count({
        where: {
          activo: true,
          created_at: {
            [Op.gte]: fecha,
            [Op.lt]: siguienteMes
          }
        }
      });

      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        nuevosRegistros: registros,
        // Simular datos adicionales
        demandaLaboral: Math.round(70 + Math.random() * 30), // Entre 70-100%
        satisfaccionPromedio: +(3.5 + Math.random() * 1.5).toFixed(1) // Entre 3.5-5.0
      });
    }

    res.json({
      ok: true,
      tendencias: {
        ultimosSeisMeses: meses,
        resumen: {
          crecimientoMensual: meses.length > 1 ? 
            meses[meses.length - 1].nuevosRegistros - meses[meses.length - 2].nuevosRegistros : 0,
          promedioSatisfaccion: +(meses.reduce((acc, m) => acc + m.satisfaccionPromedio, 0) / meses.length).toFixed(1),
          promedioDemanda: Math.round(meses.reduce((acc, m) => acc + m.demandaLaboral, 0) / meses.length)
        }
      }
    });

  } catch (error) {
    console.error('Error en obtenerTendenciasMercado:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error al obtener tendencias del mercado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  obtenerEstadisticasMercado,
  obtenerTecnologiasMasDemandadas,
  obtenerDistribucionSalarial,
  obtenerEmpresasQueContratanMas,
  obtenerTendenciasMercado
};
