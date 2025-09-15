const User = require('../models/User');
const { Op } = require('sequelize');

// Obtener estadísticas generales del mercado laboral
const obtenerEstadisticasMercado = async (req, res) => {
  try {
    const totalProfesionales = await User.count({ where: { activo: true } });
    
    // Nuevos profesionales este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const nuevosProfesionalesEsteMes = await User.count({
      where: {
        activo: true,
        created_at: { [Op.gte]: inicioMes }
      }
    });

    // Empresas únicas
    const empresasUnicas = await User.count({
      distinct: true,
      col: 'empresa_actual',
      where: { 
        activo: true,
        empresa_actual: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'No especificada' }
      }
    });

    // Industrias únicas
    const industriasUnicas = await User.count({
      distinct: true,
      col: 'industria',
      where: { 
        activo: true,
        industria: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'No especificada' }
      }
    });

    // Calcular porcentaje de crecimiento
    const mesAnterior = new Date();
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    mesAnterior.setDate(1);
    mesAnterior.setHours(0, 0, 0, 0);

    const profesionalesMesAnterior = await User.count({
      where: {
        activo: true,
        created_at: { [Op.lt]: inicioMes, [Op.gte]: mesAnterior }
      }
    });

    const porcentajeCrecimiento = profesionalesMesAnterior > 0 
      ? Math.round(((nuevosProfesionalesEsteMes - profesionalesMesAnterior) / profesionalesMesAnterior) * 100)
      : 100;

    const estadisticas = {
      totalProfesionales,
      nuevosProfesionalesEsteMes,
      empresasUnicas,
      industriasUnicas,
      porcentajeCrecimiento
    };

    res.json({
      ok: true,
      estadisticas
    });

  } catch (error) {
    console.error('Error en obtenerEstadisticasMercado:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener estadísticas del mercado'
    });
  }
};

// Obtener métricas avanzadas basadas en los nuevos campos del perfil
const obtenerMetricasAvanzadas = async (req, res) => {
  try {
    const usuariosActivos = await User.findAll({
      where: { 
        activo: true,
        perfil_completo: true // Solo usuarios con perfil completo
      },
      attributes: [
        'años_experiencia',
        'nivel_educacion',
        'especialidad_tecnica',
        'tipo_empleo_actual',
        'rango_salarial',
        'tecnologias_principales',
        'area_interes'
      ]
    });

    const totalUsuarios = usuariosActivos.length;

    if (totalUsuarios === 0) {
      return res.json({
        ok: true,
        metricas: {
          distribucionExperiencia: [],
          distribucionEducacion: [],
          tecnologiasPopulares: [],
          estadisticasSalariales: [],
          distribucionAreas: [],
          tiposEmpleo: []
        }
      });
    }

    // 1. Distribución por años de experiencia
    const experienciaRangos = {
      '0-2 años': { min: 0, max: 2 },
      '3-5 años': { min: 3, max: 5 },
      '6-10 años': { min: 6, max: 10 },
      '11-15 años': { min: 11, max: 15 },
      '16+ años': { min: 16, max: 100 }
    };

    const distribucionExperiencia = Object.entries(experienciaRangos).map(([rango, limits]) => {
      const cantidad = usuariosActivos.filter(user => 
        user.años_experiencia >= limits.min && user.años_experiencia <= limits.max
      ).length;
      return {
        rango,
        cantidad,
        porcentaje: Math.round((cantidad / totalUsuarios) * 100)
      };
    });

    // 2. Distribución por nivel de educación
    const distribucionEducacion = ['Técnico', 'Licenciatura', 'Maestría', 'Doctorado', 'Otro'].map(nivel => {
      const cantidad = usuariosActivos.filter(user => user.nivel_educacion === nivel).length;
      return {
        nivel,
        cantidad,
        porcentaje: Math.round((cantidad / totalUsuarios) * 100)
      };
    }).filter(item => item.cantidad > 0);

    // 3. Tecnologías más populares (desde especialidad_tecnica)
    const tecnologiaCount = {};
    usuariosActivos.forEach(user => {
      if (user.especialidad_tecnica) {
        tecnologiaCount[user.especialidad_tecnica] = (tecnologiaCount[user.especialidad_tecnica] || 0) + 1;
      }
    });

    const tecnologiasPopulares = Object.entries(tecnologiaCount)
      .map(([tecnologia, cantidad]) => ({
        tecnologia,
        cantidad,
        porcentaje: Math.round((cantidad / totalUsuarios) * 100),
        tendencia: 'stable' // Simplificado por ahora
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    // 4. Estadísticas salariales
    const estadisticasSalariales = ['0-500k', '500k-1M', '1M-1.5M', '1.5M-2M', '2M-3M', '3M+', 'Prefiero no decir'].map(rango => {
      const cantidad = usuariosActivos.filter(user => user.rango_salarial === rango).length;
      return {
        rango,
        cantidad,
        porcentaje: Math.round((cantidad / totalUsuarios) * 100)
      };
    }).filter(item => item.cantidad > 0);

    // 5. Distribución por áreas de interés
    const areaCount = {};
    usuariosActivos.forEach(user => {
      if (user.area_interes) {
        areaCount[user.area_interes] = (areaCount[user.area_interes] || 0) + 1;
      }
    });

    const distribucionAreas = Object.entries(areaCount)
      .map(([area, cantidad]) => ({
        area,
        cantidad,
        porcentaje: Math.round((cantidad / totalUsuarios) * 100),
        demandaLaboral: Math.floor(Math.random() * 100) + 50 // Simplificado
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // 6. Tipos de empleo
    const tiposEmpleo = ['Tiempo completo', 'Part-time', 'Freelance', 'Desempleado', 'Estudiante'].map(tipo => {
      const cantidad = usuariosActivos.filter(user => user.tipo_empleo_actual === tipo).length;
      return {
        tipo,
        cantidad,
        porcentaje: Math.round((cantidad / totalUsuarios) * 100)
      };
    }).filter(item => item.cantidad > 0);

    const metricas = {
      distribucionExperiencia,
      distribucionEducacion,
      tecnologiasPopulares,
      estadisticasSalariales,
      distribucionAreas,
      tiposEmpleo
    };

    res.json({
      ok: true,
      metricas
    });

  } catch (error) {
    console.error('Error en obtenerMetricasAvanzadas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener métricas avanzadas'
    });
  }
};

// Obtener tecnologías más demandadas (simulado)
const obtenerTecnologiasMasDemandadas = async (req, res) => {
  try {
    // Contar especialidades técnicas más populares
    const tecnologias = await User.findAll({
      where: { 
        activo: true,
        especialidad_tecnica: { [Op.not]: null, [Op.ne]: '' }
      },
      attributes: ['especialidad_tecnica']
    });

    const tecnologiaCount = {};
    tecnologias.forEach(user => {
      const tech = user.especialidad_tecnica;
      tecnologiaCount[tech] = (tecnologiaCount[tech] || 0) + 1;
    });

    const tecnologiasDemandadas = Object.entries(tecnologiaCount)
      .map(([nombre, demanda]) => ({ nombre, demanda }))
      .sort((a, b) => b.demanda - a.demanda)
      .slice(0, 10);

    res.json({
      ok: true,
      tecnologias: tecnologiasDemandadas
    });

  } catch (error) {
    console.error('Error en obtenerTecnologiasMasDemandadas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener tecnologías demandadas'
    });
  }
};

// Obtener distribución salarial (simulado)
const obtenerDistribucionSalarial = async (req, res) => {
  try {
    console.log('🔍 Obteniendo distribución salarial...');
    
    const distribucion = await User.findAll({
      where: { 
        activo: true,
        rango_salarial: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'Prefiero no decir' }
      },
      attributes: ['rango_salarial', 'industria']
    });

    console.log('📊 Usuarios encontrados para distribución salarial:', distribucion.length);

    const distribuciones = {};
    distribucion.forEach(user => {
      const industria = user.industria || 'Sin especificar';
      if (!distribuciones[industria]) {
        distribuciones[industria] = {
          industria,
          cantidad: 0,
          salarioMinimo: 500000,
          salarioMaximo: 3000000,
          salarioPromedio: 1500000,
          variacionMensual: Math.floor(Math.random() * 20) - 10
        };
      }
      distribuciones[industria].cantidad++;
    });

    let resultado = Object.values(distribuciones);
    
    // Si no hay suficientes datos reales, generar datos de muestra
    if (resultado.length === 0) {
      console.log('⚠️ No hay datos salariales reales, generando datos de muestra...');
      resultado = [
        {
          industria: 'Tecnología',
          cantidad: 15,
          salarioMinimo: 800000,
          salarioMaximo: 3500000,
          salarioPromedio: 2100000,
          variacionMensual: 8
        },
        {
          industria: 'Finanzas',
          cantidad: 8,
          salarioMinimo: 1000000,
          salarioMaximo: 4000000,
          salarioPromedio: 2400000,
          variacionMensual: 5
        },
        {
          industria: 'Salud',
          cantidad: 6,
          salarioMinimo: 900000,
          salarioMaximo: 3200000,
          salarioPromedio: 1800000,
          variacionMensual: 3
        },
        {
          industria: 'Educación',
          cantidad: 4,
          salarioMinimo: 600000,
          salarioMaximo: 2000000,
          salarioPromedio: 1200000,
          variacionMensual: 2
        },
        {
          industria: 'Energía y servicios públicos',
          cantidad: 3,
          salarioMinimo: 1200000,
          salarioMaximo: 3800000,
          salarioPromedio: 2500000,
          variacionMensual: 6
        }
      ];
    }
    
    console.log('📈 Distribución salarial final:', resultado);

    res.json({
      ok: true,
      distribucionSalarial: resultado
    });

  } catch (error) {
    console.error('Error en obtenerDistribucionSalarial:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener distribución salarial'
    });
  }
};

// Obtener empresas que más contratan (simulado)
const obtenerEmpresasQueContratanMas = async (req, res) => {
  try {
    const empresas = await User.findAll({
      where: { 
        activo: true,
        empresa_actual: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'No especificada' }
      },
      attributes: ['empresa_actual']
    });

    const empresaCount = {};
    empresas.forEach(user => {
      const empresa = user.empresa_actual;
      empresaCount[empresa] = (empresaCount[empresa] || 0) + 1;
    });

    const empresasContratantes = Object.entries(empresaCount)
      .map(([empresa, totalEmpleados]) => ({
        empresa,
        totalEmpleados,
        vacantesAbiertas: Math.floor(Math.random() * 10) + 1,
        promedioSalario: Math.floor(Math.random() * 2000000) + 800000,
        satisfaccionLaboral: Math.floor(Math.random() * 30) + 70,
        tipoEmpresa: ['Startup', 'Corporación', 'Pyme', 'Multinacional'][Math.floor(Math.random() * 4)]
      }))
      .sort((a, b) => b.totalEmpleados - a.totalEmpleados)
      .slice(0, 10);

    res.json({
      ok: true,
      empresas: empresasContratantes
    });

  } catch (error) {
    console.error('Error en obtenerEmpresasQueContratanMas:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener empresas'
    });
  }
};

// Obtener tendencias del mercado (simulado)
const obtenerTendenciasMercado = async (req, res) => {
  try {
    const ultimosSeisMeses = [];
    const fechaActual = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(fechaActual);
      fecha.setMonth(fecha.getMonth() - i);
      
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

      const nuevosRegistros = await User.count({
        where: {
          activo: true,
          created_at: { [Op.between]: [inicioMes, finMes] }
        }
      });

      ultimosSeisMeses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        nuevosRegistros,
        demandaLaboral: Math.floor(Math.random() * 50) + 50,
        satisfaccionPromedio: Math.floor(Math.random() * 20) + 70
      });
    }

    const resumen = {
      crecimientoMensual: Math.floor(Math.random() * 20) + 5,
      promedioSatisfaccion: Math.floor(Math.random() * 20) + 75,
      promedioDemanda: Math.floor(Math.random() * 30) + 60
    };

    res.json({
      ok: true,
      tendencias: {
        ultimosSeisMeses,
        resumen
      }
    });

  } catch (error) {
    console.error('Error en obtenerTendenciasMercado:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener tendencias'
    });
  }
};

module.exports = {
  obtenerEstadisticasMercado,
  obtenerMetricasAvanzadas,
  obtenerTecnologiasMasDemandadas,
  obtenerDistribucionSalarial,
  obtenerEmpresasQueContratanMas,
  obtenerTendenciasMercado
};