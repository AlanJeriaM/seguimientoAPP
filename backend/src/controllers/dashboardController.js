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
        porcentaje: Math.round((cantidad / totalUsuarios) * 100)
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
        porcentaje: Math.round((cantidad / totalUsuarios) * 100)
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

    // Función para convertir rango salarial a valor promedio
    const convertirRangoASalario = (rango) => {
      switch(rango) {
        case '0-500k': return 400000;
        case '500k-1M': return 750000;
        case '1M-1.5M': return 1250000;
        case '1.5M-2M': return 1750000;
        case '2M-3M': return 2500000;
        case '3M+': return 3500000;
        default: return 1000000; // Valor por defecto
      }
    };

    const distribuciones = {};
    distribucion.forEach(user => {
      const industria = user.industria || 'Sin especificar';
      const salarioPromedio = convertirRangoASalario(user.rango_salarial);
      
      if (!distribuciones[industria]) {
        distribuciones[industria] = {
          industria,
          cantidad: 0,
          salariosTotales: 0,
          salarios: []
        };
      }
      
      distribuciones[industria].cantidad++;
      distribuciones[industria].salariosTotales += salarioPromedio;
      distribuciones[industria].salarios.push(salarioPromedio);
    });

    // Calcular promedios reales por industria
    Object.keys(distribuciones).forEach(industria => {
      const data = distribuciones[industria];
      data.salarioPromedio = Math.round(data.salariosTotales / data.cantidad);
      data.salarioMinimo = Math.min(...data.salarios);
      data.salarioMaximo = Math.max(...data.salarios);
      
      // Eliminar campos temporales
      delete data.salariosTotales;
      delete data.salarios;
    });

    const resultado = Object.values(distribuciones);
    
    console.log(`📈 Distribución salarial real de ${resultado.length} industrias:`, resultado);

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
    // Función para convertir rango salarial a valor promedio
    const convertirRangoASalario = (rango) => {
      switch(rango) {
        case '0-500k': return 400000;
        case '500k-1M': return 750000;
        case '1M-1.5M': return 1250000;
        case '1.5M-2M': return 1750000;
        case '2M-3M': return 2500000;
        case '3M+': return 3500000;
        default: return 1000000; // Valor por defecto
      }
    };

    const empresas = await User.findAll({
      where: { 
        activo: true,
        empresa_actual: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'No especificada' }
      },
      attributes: ['empresa_actual', 'rango_salarial', 'satisfaccion_laboral']
    });

    const empresaData = {};
    empresas.forEach(user => {
      const empresa = user.empresa_actual;
      const salario = convertirRangoASalario(user.rango_salarial);
      
      if (!empresaData[empresa]) {
        empresaData[empresa] = {
          empresa,
          totalEmpleados: 0,
          salarios: [],
          satisfacciones: []
        };
      }
      
      empresaData[empresa].totalEmpleados++;
      if (user.rango_salarial && user.rango_salarial !== 'Prefiero no decir') {
        empresaData[empresa].salarios.push(salario);
      }
      if (user.satisfaccion_laboral && user.satisfaccion_laboral >= 1 && user.satisfaccion_laboral <= 5) {
        empresaData[empresa].satisfacciones.push(user.satisfaccion_laboral);
      }
    });

    const empresasContratantes = Object.values(empresaData)
      .map(data => {
        // Calcular salario promedio real si hay datos, sino usar promedio del mercado
        const promedioSalario = data.salarios.length > 0 
          ? Math.round(data.salarios.reduce((sum, sal) => sum + sal, 0) / data.salarios.length)
          : 1200000; // Promedio del mercado chileno
        
        // Calcular satisfacción promedio real si hay datos
        const satisfaccionPromedio = data.satisfacciones.length > 0 
          ? parseFloat((data.satisfacciones.reduce((sum, sat) => sum + sat, 0) / data.satisfacciones.length).toFixed(1))
          : null;
        
        return {
          empresa: data.empresa,
          totalEmpleados: data.totalEmpleados,
          promedioSalario,
          satisfaccionPromedio,
          tipoEmpresa: data.totalEmpleados >= 100 ? 'Corporación' : 
                      data.totalEmpleados >= 50 ? 'Pyme' : 'Startup'
        };
      })
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

// Obtener tendencias del mercado basadas en datos reales
const obtenerTendenciasMercado = async (req, res) => {
  try {
    const ultimosSeisMeses = [];
    const fechaActual = new Date();

    // Calcular datos reales para los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(fechaActual);
      fecha.setMonth(fecha.getMonth() - i);
      
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

      // Nuevos registros del mes
      const nuevosRegistros = await User.count({
        where: {
          activo: true,
          created_at: { [Op.between]: [inicioMes, finMes] }
        }
      });

      // Usuarios con perfil completo en ese mes
      const perfilesCompletos = await User.count({
        where: {
          activo: true,
          perfil_completo: true,
          created_at: { [Op.between]: [inicioMes, finMes] }
        }
      });

      ultimosSeisMeses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        nuevosRegistros,
        perfilesCompletos
      });
    }

    // Calcular resumen basado en datos reales
    const totalNuevosRegistros = ultimosSeisMeses.reduce((sum, mes) => sum + mes.nuevosRegistros, 0);
    const totalPerfilesCompletos = ultimosSeisMeses.reduce((sum, mes) => sum + mes.perfilesCompletos, 0);
    
    // Calcular crecimiento real comparando últimos 3 vs primeros 3 meses
    const primerosTres = ultimosSeisMeses.slice(0, 3).reduce((sum, mes) => sum + mes.nuevosRegistros, 0);
    const ultimosTres = ultimosSeisMeses.slice(3, 6).reduce((sum, mes) => sum + mes.nuevosRegistros, 0);
    const crecimientoMensual = primerosTres > 0 ? Math.round(((ultimosTres - primerosTres) / primerosTres) * 100) : 0;

    const resumen = {
      crecimientoMensual,
      totalRegistros: totalNuevosRegistros,
      porcentajePerfilCompleto: totalNuevosRegistros > 0 ? Math.round((totalPerfilesCompletos / totalNuevosRegistros) * 100) : 0
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

// Obtener estadísticas de satisfacción laboral
const obtenerSatisfaccionLaboral = async (req, res) => {
  try {
    // Obtener todos los datos de satisfacción por empresa
    const usuarios = await User.findAll({
      where: { 
        activo: true,
        satisfaccion_laboral: { [Op.not]: null, [Op.between]: [1, 5] },
        empresa_actual: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'No especificada' }
      },
      attributes: ['empresa_actual', 'satisfaccion_laboral']
    });

    // Agrupar por empresa y calcular promedios
    const satisfaccionPorEmpresa = {};
    usuarios.forEach(user => {
      const empresa = user.empresa_actual;
      if (!satisfaccionPorEmpresa[empresa]) {
        satisfaccionPorEmpresa[empresa] = {
          empresa,
          satisfacciones: [],
          totalEmpleados: 0
        };
      }
      satisfaccionPorEmpresa[empresa].satisfacciones.push(user.satisfaccion_laboral);
      satisfaccionPorEmpresa[empresa].totalEmpleados++;
    });

    // Calcular promedios y preparar datos para el gráfico
    const empresasConSatisfaccion = Object.values(satisfaccionPorEmpresa)
      .map(data => ({
        empresa: data.empresa,
        satisfaccionPromedio: parseFloat((data.satisfacciones.reduce((sum, sat) => sum + sat, 0) / data.satisfacciones.length).toFixed(1)),
        totalRespuestas: data.satisfacciones.length,
        distribucion: {
          estrellas1: data.satisfacciones.filter(s => s === 1).length,
          estrellas2: data.satisfacciones.filter(s => s === 2).length,
          estrellas3: data.satisfacciones.filter(s => s === 3).length,
          estrellas4: data.satisfacciones.filter(s => s === 4).length,
          estrellas5: data.satisfacciones.filter(s => s === 5).length
        }
      }))
      .filter(empresa => empresa.totalRespuestas >= 2) // Solo empresas con al menos 2 respuestas
      .sort((a, b) => b.satisfaccionPromedio - a.satisfaccionPromedio)
      .slice(0, 15); // Top 15 empresas

    // Calcular estadísticas generales
    const todasLasSatisfacciones = usuarios.map(u => u.satisfaccion_laboral);
    const satisfaccionGeneral = todasLasSatisfacciones.length > 0 
      ? parseFloat((todasLasSatisfacciones.reduce((sum, sat) => sum + sat, 0) / todasLasSatisfacciones.length).toFixed(1))
      : 0;

    const distribucionGeneral = {
      estrellas1: todasLasSatisfacciones.filter(s => s === 1).length,
      estrellas2: todasLasSatisfacciones.filter(s => s === 2).length,
      estrellas3: todasLasSatisfacciones.filter(s => s === 3).length,
      estrellas4: todasLasSatisfacciones.filter(s => s === 4).length,
      estrellas5: todasLasSatisfacciones.filter(s => s === 5).length
    };

    res.json({
      ok: true,
      satisfaccion: {
        empresas: empresasConSatisfaccion,
        general: {
          satisfaccionPromedio: satisfaccionGeneral,
          totalRespuestas: todasLasSatisfacciones.length,
          distribucion: distribucionGeneral
        }
      }
    });

  } catch (error) {
    console.error('Error en obtenerSatisfaccionLaboral:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener satisfacción laboral'
    });
  }
};

module.exports = {
  obtenerEstadisticasMercado,
  obtenerMetricasAvanzadas,
  obtenerTecnologiasMasDemandadas,
  obtenerDistribucionSalarial,
  obtenerEmpresasQueContratanMas,
  obtenerTendenciasMercado,
  obtenerSatisfaccionLaboral
};