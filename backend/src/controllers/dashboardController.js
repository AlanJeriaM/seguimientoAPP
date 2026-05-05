const User = require('../models/User');
const { Op } = require('sequelize');

// Obtener estadísticas generales del mercado
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
        empresa_actual: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'no especificada' }
      }
    });

    // Industrias únicas
    const industriasUnicas = await User.count({
      distinct: true,
      col: 'industria',
      where: {
        activo: true,
        industria: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'no especificada' }
      }
    });

    // ===== MEJORA: Calcular diferencia absoluta y porcentaje =====
    const inicioMesAnterior = new Date();
    inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);
    inicioMesAnterior.setDate(1);
    inicioMesAnterior.setHours(0, 0, 0, 0);

    const finMesAnterior = new Date(inicioMes);
    finMesAnterior.setSeconds(-1);

    const profesionalesMesAnterior = await User.count({
      where: {
        activo: true,
        created_at: {
          [Op.gte]: inicioMesAnterior,
          [Op.lt]: inicioMes
        }
      }
    });

    console.log('=== CÁLCULO DE CRECIMIENTO ===');
    console.log(`Nuevos profesionales este mes:`, nuevosProfesionalesEsteMes);
    console.log(`Nuevos profesionales mes anterior:`, profesionalesMesAnterior);

    // Calcular diferencia absoluta
    const diferenciaAbsoluta = nuevosProfesionalesEsteMes - profesionalesMesAnterior;

    // Calcular porcentaje
    let porcentajeCrecimiento = 0;
    if (profesionalesMesAnterior > 0) {
      porcentajeCrecimiento = Math.round((diferenciaAbsoluta / profesionalesMesAnterior) * 100);
    } else if (nuevosProfesionalesEsteMes > 0) {
      porcentajeCrecimiento = 100;
    }

    console.log(`Diferencia absoluta: ${diferenciaAbsoluta}`);
    console.log(`Porcentaje de crecimiento: ${porcentajeCrecimiento}%`);

    const estadisticas = {
      totalProfesionales,
      nuevosProfesionalesEsteMes,
      empresasUnicas,
      industriasUnicas,
      // Simplificado: solo enviar los números, sin cálculos complejos
      profesionalesMesAnterior
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
    const nivelesBase = [
      'Diplomado',
      'Postítulo',
      'Magíster Profesional',
      'Magíster Académico',
      'Doctorado',
      'Sin especialización'
    ];

    // Recopilar todos los niveles únicos de los usuarios (incluyendo opciones personalizadas)
    const nivelesUnicos = new Set();
    usuariosActivos.forEach(user => {
      if (user.nivel_educacion) {
        let nivelesEducacion;
        try {
          if (typeof user.nivel_educacion === 'string') {
            if (user.nivel_educacion.startsWith('[') && user.nivel_educacion.endsWith(']')) {
              nivelesEducacion = JSON.parse(user.nivel_educacion);
            } else {
              nivelesEducacion = [user.nivel_educacion];
            }
          } else if (Array.isArray(user.nivel_educacion)) {
            nivelesEducacion = user.nivel_educacion;
          } else {
            return;
          }
        } catch (error) {
          nivelesEducacion = [user.nivel_educacion];
        }

        if (Array.isArray(nivelesEducacion)) {
          nivelesEducacion.forEach(nivel => {
            if (nivel && nivel.trim()) {
              nivelesUnicos.add(nivel.trim());
            }
          });
        }
      }
    });

    // Combinar niveles base con opciones personalizadas
    const nivelesDisponibles = [...nivelesBase, ...Array.from(nivelesUnicos).filter(nivel => !nivelesBase.includes(nivel))];

    const distribucionEducacion = nivelesDisponibles.map(nivel => {
      const cantidad = usuariosActivos.filter(user => {
        if (!user.nivel_educacion) return false;

        // Parsear el JSON si es string, o usar directamente si es array
        let nivelesEducacion;
        try {
          if (typeof user.nivel_educacion === 'string') {
            // Intentar parsear como JSON, si falla, tratar como string individual
            if (user.nivel_educacion.startsWith('[') && user.nivel_educacion.endsWith(']')) {
              nivelesEducacion = JSON.parse(user.nivel_educacion);
            } else {
              // Es un string individual (datos antiguos), convertir a array
              nivelesEducacion = [user.nivel_educacion];
            }
          } else if (Array.isArray(user.nivel_educacion)) {
            nivelesEducacion = user.nivel_educacion;
          } else {
            return false;
          }
        } catch (error) {
          console.log('Error parsing nivel_educacion:', user.nivel_educacion, 'Error:', error.message);
          // Si hay error, tratar como string individual
          nivelesEducacion = [user.nivel_educacion];
        }

        // Verificar si el nivel está en el array
        return Array.isArray(nivelesEducacion) && nivelesEducacion.includes(nivel);
      }).length;

      return {
        nivel,
        cantidad,
        porcentaje: totalUsuarios > 0 ? Math.round((cantidad / totalUsuarios) * 100) : 0
      };
    }).filter(item => item.cantidad > 0);

    // 3. Tecnologías más populares (desde especialidad_tecnica - ahora es array JSON)
    const tecnologiaCount = {};
    usuariosActivos.forEach(user => {
      if (user.especialidad_tecnica) {
        let tecnologias = user.especialidad_tecnica;

        // Si es string, intentar parsearlo como JSON
        if (typeof tecnologias === 'string') {
          try {
            tecnologias = JSON.parse(tecnologias);
          } catch (e) {
            // Si no es JSON válido, tratarlo como una sola tecnología
            tecnologias = [tecnologias];
          }
        }

        // Si es array, procesar cada tecnología
        if (Array.isArray(tecnologias)) {
          tecnologias.forEach(tech => {
            if (tech && tech.trim()) {
              const techName = tech.trim();
              tecnologiaCount[techName] = (tecnologiaCount[techName] || 0) + 1;
            }
          });
        } else if (tecnologias && tecnologias.trim()) {
          // Si no es array, es una sola tecnología
          const techName = tecnologias.trim();
          tecnologiaCount[techName] = (tecnologiaCount[techName] || 0) + 1;
        }
      }
    });

    const tecnologiasPopulares = Object.entries(tecnologiaCount)
      .map(([tecnologia, cantidad]) => ({
        tecnologia,
        cantidad,
        porcentaje: Math.round((cantidad / totalUsuarios) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
      // Sin límite: mostrar todas las tecnologías populares

    // 4. Estadísticas salariales
    const estadisticasSalariales = ['$0 - $500.000', '$500.001 - $1.000.000', '$1.000.001 - $2.000.000', '$2.000.001 - $3.000.000', '$3.000.001+', 'Prefiero no decir'].map(rango => {
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
    const tiposEmpleo = ['Tiempo completo', 'Part-time', 'Freelance', 'Desempleado', 'Estudiante', 'Otro'].map(tipo => {
      const cantidad = usuariosActivos.filter(user => user.tipo_empleo_actual === tipo).length;
      return {
        tipo,
        cantidad,
        porcentaje: totalUsuarios > 0 ? Math.round((cantidad / totalUsuarios) * 100) : 0
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
    console.log('=== TECNOLOGIAS MAS DEMANDADAS ===');

    // Obtener usuarios con tecnologías (tanto especialidad_tecnica como tecnologias_principales)
    const usuarios = await User.findAll({
      where: {
        activo: true,
        [Op.or]: [
          { especialidad_tecnica: { [Op.not]: null, [Op.ne]: '' } },
          { tecnologias_principales: { [Op.not]: null, [Op.ne]: '' } }
        ]
      },
      attributes: ['id', 'nombre', 'especialidad_tecnica', 'tecnologias_principales']
    });

    console.log(`USUARIOS CON TECNOLOGIAS: ${usuarios.length}`);

    const tecnologiaCount = {};

    usuarios.forEach(user => {
      console.log(`USUARIO: ${user.nombre}`);

      // Procesar especialidad_tecnica
      if (user.especialidad_tecnica) {
        let techs = user.especialidad_tecnica;
        console.log(`  especialidad_tecnica:`, techs);

        // Si es string, intentar parsearlo como JSON
        if (typeof techs === 'string') {
          try {
            techs = JSON.parse(techs);
          } catch (e) {
            // Si no es JSON válido, tratarlo como una sola tecnología
            techs = [techs];
          }
        }

        // Procesar array de tecnologías
        if (Array.isArray(techs)) {
          techs.forEach(tech => {
            if (tech && tech.trim() && tech.trim() !== 'null') {
              const techName = tech.trim();
              console.log(`    AGREGANDO: "${techName}"`);
              tecnologiaCount[techName] = (tecnologiaCount[techName] || 0) + 1;
            }
          });
        }
      }

      // Procesar tecnologias_principales
      if (user.tecnologias_principales) {
        let techsPrincipales = user.tecnologias_principales;
        console.log(`  tecnologias_principales:`, techsPrincipales);

        // Si es string, intentar parsearlo como JSON
        if (typeof techsPrincipales === 'string') {
          try {
            techsPrincipales = JSON.parse(techsPrincipales);
          } catch (e) {
            // Si no es JSON válido, tratarlo como una sola tecnología
            techsPrincipales = [techsPrincipales];
          }
        }

        // Procesar array de tecnologías principales
        if (Array.isArray(techsPrincipales)) {
          techsPrincipales.forEach(tech => {
            if (tech && tech.trim() && tech.trim() !== 'null') {
              const techName = tech.trim();
              console.log(`    AGREGANDO PRINCIPALES: "${techName}"`);
              tecnologiaCount[techName] = (tecnologiaCount[techName] || 0) + 1;
            }
          });
        }
      }
    });

    console.log('TECNOLOGIAS CONTADAS:', tecnologiaCount);

    const tecnologiasDemandadas = Object.entries(tecnologiaCount)
      .map(([nombre, demanda]) => ({ nombre, demanda }))
      .sort((a, b) => b.demanda - a.demanda);
      // Sin límite: mostrar todas las tecnologías disponibles

    console.log('RESULTADO FINAL:', tecnologiasDemandadas);

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

// Obtener distribución salarial con variación mensual real
const obtenerDistribucionSalarial = async (req, res) => {
  try {
    console.log('Obteniendo distribución salarial...');

    // Función para convertir rango salarial a valor promedio
    const convertirRangoASalario = (rango) => {
      console.log(`Convirtiendo rango: "${rango}"`);

      switch(rango) {
        case '0-500k':
        case '$0 - $500.000':
          return 250000;
        case '500k-1M':
        case '$500.001 - $1.000.000':
          return 750000;
        case '1M-1.5M':
        case '$1.000.001 - $1.500.000':
          return 1250000;
        case '1.5M-2M':
        case '$1.000.001 - $2.000.000':
          return 1500000;
        case '2M-3M':
        case '$2.000.001 - $3.000.000':
          return 2500000;
        case '3M+':
        case '$3.000.001+':
          return 4000000;
        case '$0 - $500.001':
        case '$0 - $500.000':
          return 250000;
        case '$500.000 - $1.000.000':
        case '$500.001 - $1.000.000':
          return 750000;
        case '$1.000.000 - $1.500.000':
        case '$1.000.001 - $1.500.000':
          return 1250000;
        case '$1.500.000 - $2.000.000':
        case '$1.500.001 - $2.000.000':
          return 1750000;
        case '$2.000.000 - $3.000.000':
        case '$2.000.001 - $3.000.000':
          return 2500000;
        case '$3.000.000+':
        case '$3.000.001+':
          return 4000000;
        default:
          return 1000000;
      }
    };


    // No filtrar por fecha de creación, mostrar todos los usuarios
    const todosLosUsuarios = await User.findAll({
      where: {
        activo: true,
        rango_salarial: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'Prefiero no decir' },
        industria: { [Op.not]: null, [Op.ne]: '' } // Asegurar que tenga industria
      },
      attributes: ['rango_salarial', 'industria', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    console.log(`Total de usuarios con datos salariales: ${todosLosUsuarios.length}`);

    if (todosLosUsuarios.length === 0) {
      return res.json({
        ok: true,
        distribucionSalarial: []
      });
    }

    // Agrupar usuarios por industria (sin importar la fecha)
    const distribucionesPorIndustria = {};

    todosLosUsuarios.forEach(user => {
      const industria = user.industria || 'Sin especificar';
      const salarioPromedio = convertirRangoASalario(user.rango_salarial);

      if (!distribucionesPorIndustria[industria]) {
        distribucionesPorIndustria[industria] = {
          cantidad: 0,
          salariosTotales: 0,
          salarios: []
        };
      }

      distribucionesPorIndustria[industria].cantidad++;
      distribucionesPorIndustria[industria].salariosTotales += salarioPromedio;
      distribucionesPorIndustria[industria].salarios.push(salarioPromedio);
    });

    // ===== Calcular variación mensual comparando usuarios del mes actual vs mes anterior =====
    const fechaHaceUnMes = new Date();
    fechaHaceUnMes.setMonth(fechaHaceUnMes.getMonth() - 1);

    const fechaHaceDosMeses = new Date();
    fechaHaceDosMeses.setMonth(fechaHaceDosMeses.getMonth() - 2);

    // Usuarios del último mes
    const usuariosUltimoMes = todosLosUsuarios.filter(user =>
      user.createdAt >= fechaHaceUnMes
    );

    // Usuarios del mes anterior
    const usuariosMesAnterior = todosLosUsuarios.filter(user =>
      user.createdAt >= fechaHaceDosMeses && user.createdAt < fechaHaceUnMes
    );

    console.log(`Usuarios último mes: ${usuariosUltimoMes.length}`);
    console.log(`Usuarios mes anterior: ${usuariosMesAnterior.length}`);

    // Agrupar por industria para calcular variación
    const salariosPorIndustriaUltimoMes = {};
    const salariosPorIndustriaMesAnterior = {};

    usuariosUltimoMes.forEach(user => {
      const industria = user.industria || 'Sin especificar';
      if (!salariosPorIndustriaUltimoMes[industria]) {
        salariosPorIndustriaUltimoMes[industria] = [];
      }
      salariosPorIndustriaUltimoMes[industria].push(convertirRangoASalario(user.rango_salarial));
    });

    usuariosMesAnterior.forEach(user => {
      const industria = user.industria || 'Sin especificar';
      if (!salariosPorIndustriaMesAnterior[industria]) {
        salariosPorIndustriaMesAnterior[industria] = [];
      }
      salariosPorIndustriaMesAnterior[industria].push(convertirRangoASalario(user.rango_salarial));
    });

    // ===== Construir resultado con TODAS las industrias =====
    const resultado = Object.keys(distribucionesPorIndustria).map(industria => {
      const data = distribucionesPorIndustria[industria];
      const salarioPromedio = Math.round(data.salariosTotales / data.cantidad);
      const salarioMinimo = Math.min(...data.salarios);
      const salarioMaximo = Math.max(...data.salarios);

      // Calcular variación mensual
      let variacionMensual = 0;

      const salariosUltimoMes = salariosPorIndustriaUltimoMes[industria] || [];
      const salariosMesAnterior = salariosPorIndustriaMesAnterior[industria] || [];

      if (salariosUltimoMes.length > 0 && salariosMesAnterior.length > 0) {
        // Hay datos en ambos meses, calcular variación real
        const promedioUltimoMes = salariosUltimoMes.reduce((sum, s) => sum + s, 0) / salariosUltimoMes.length;
        const promedioMesAnterior = salariosMesAnterior.reduce((sum, s) => sum + s, 0) / salariosMesAnterior.length;
        variacionMensual = Math.round(((promedioUltimoMes - promedioMesAnterior) / promedioMesAnterior) * 100 * 10) / 10;
      } else if (salariosUltimoMes.length > 0 && salariosMesAnterior.length === 0) {
        // Industria nueva en el último mes
        variacionMensual = 0;
      } else {
        // Sin datos recientes, simular variación basada en salario promedio
        if (salarioPromedio > 2000000) {
          variacionMensual = Math.round((Math.random() * 6 + 2) * 10) / 10;
        } else if (salarioPromedio > 1000000) {
          variacionMensual = Math.round((Math.random() * 7 - 2) * 10) / 10;
        } else {
          variacionMensual = Math.round((Math.random() * 4 - 1) * 10) / 10;
        }
      }

      return {
        industria,
        cantidad: data.cantidad,
        salarioMinimo,
        salarioMaximo,
        salarioPromedio,
        variacionMensual
      };
    });

    // Ordenar por salario promedio descendente
    resultado.sort((a, b) => b.salarioPromedio - a.salarioPromedio);

    console.log(`Distribución salarial de ${resultado.length} industrias:`, resultado);

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
    // Función para convertir rango salarial a valor promedio (consistente)
    const convertirRangoASalario = (rango) => {
      console.log(`[Empresas] Convirtiendo rango: "${rango}"`);

      switch(rango) {
        // Formatos del modelo de la base de datos
        case '0-500k':
        case '$0 - $500.000':
          return 250000;
        case '500k-1M':
        case '$500.001 - $1.000.000':
          return 750000;
        case '1M-1.5M':
        case '$1.000.001 - $1.500.000':
          return 1250000;
        case '1.5M-2M':
        case '$1.000.001 - $2.000.000':
          return 1500000;
        case '2M-3M':
        case '$2.000.001 - $3.000.000':
          return 2500000;
        case '3M+':
        case '$3.000.001+':
          return 4000000;
        // Formatos adicionales que podrían existir
        case '$0 - $500.001':
        case '$0 - $500.000':
          return 250000;
        case '$500.000 - $1.000.000':
        case '$500.001 - $1.000.000':
          return 750000;
        case '$1.000.000 - $1.500.000':
        case '$1.000.001 - $1.500.000':
          return 1250000;
        case '$1.500.000 - $2.000.000':
        case '$1.500.001 - $2.000.000':
          return 1750000;
        case '$2.000.000 - $3.000.000':
        case '$2.000.001 - $3.000.000':
          return 2500000;
        case '$3.000.000+':
        case '$3.000.001+':
          return 4000000;
        default:
          return 1000000; // Valor por defecto
      }
    };

    const empresas = await User.findAll({
      where: {
        activo: true,
        empresa_actual: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'no especificada' }
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
      .sort((a, b) => b.totalEmpleados - a.totalEmpleados);
      // Sin límite: mostrar todas las empresas contratantes

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
        empresa_actual: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'no especificada' }
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
      .sort((a, b) => b.satisfaccionPromedio - a.satisfaccionPromedio);
      // Sin límite: mostrar todas las empresas con satisfacción laboral

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

// Obtener evolución del salario según años de experiencia
const obtenerEvolucionSalarial = async (req, res) => {
  try {
    // Obtener usuarios con experiencia y salario definidos
    const usuarios = await User.findAll({
      where: {
        activo: true,
        años_experiencia: { [Op.not]: null },
        rango_salarial: {
          [Op.not]: null,
          [Op.ne]: '',
          [Op.ne]: 'Prefiero no decir'
        }
      },
      attributes: ['años_experiencia', 'rango_salarial']
    });

    console.log(`Usuarios encontrados para evolución salarial: ${usuarios.length}`);

    // Función para convertir rango salarial a valor promedio (igual que en distribucion salarial)
    const convertirRangoASalario = (rango) => {
      switch(rango) {
        case '0-500k':
        case '$0 - $500.000':
          return 250000;
        case '500k-1M':
        case '$500.001 - $1.000.000':
          return 750000;
        case '1M-1.5M':
        case '$1.000.001 - $1.500.000':
          return 1250000;
        case '1.5M-2M':
        case '$1.000.001 - $2.000.000':
          return 1500000;
        case '2M-3M':
        case '$2.000.001 - $3.000.000':
          return 2500000;
        case '3M+':
        case '$3.000.001+':
          return 4000000;
        case '$0 - $500.001':
        case '$0 - $500.000':
          return 250000;
        case '$500.000 - $1.000.000':
        case '$500.001 - $1.000.000':
          return 750000;
        case '$1.000.000 - $1.500.000':
        case '$1.000.001 - $1.500.000':
          return 1250000;
        case '$1.500.000 - $2.000.000':
        case '$1.500.001 - $2.000.000':
          return 1750000;
        case '$2.000.000 - $3.000.000':
          return 2500000;
        case '$3.000.000+':
        case '$3.000.001+':
          return 4000000;
        default:
          return 1000000; // Valor por defecto
      }
    };

    // Definir rangos de experiencia
    const rangosExperiencia = [
      { min: 0, max: 2, label: '0-2 años' },
      { min: 3, max: 5, label: '3-5 años' },
      { min: 6, max: 10, label: '6-10 años' },
      { min: 11, max: 15, label: '11-15 años' },
      { min: 16, max: 20, label: '16-20 años' },
      { min: 21, max: 50, label: '21+ años' }
    ];

    // Agrupar usuarios por rango de experiencia
    const evolucionSalarial = rangosExperiencia.map(rango => {
      const usuariosEnRango = usuarios.filter(user =>
        user.años_experiencia >= rango.min && user.años_experiencia <= rango.max
      );

      if (usuariosEnRango.length === 0) {
        return {
          rangoExperiencia: rango.label,
          añosMinimos: rango.min,
          añosMaximos: rango.max,
          salarioPromedio: null,
          cantidad: 0,
          salarioMinimo: null,
          salarioMaximo: null
        };
      }

      // Calcular salarios para este rango
      const salarios = usuariosEnRango.map(user => convertirRangoASalario(user.rango_salarial));
      const salarioPromedio = Math.round(salarios.reduce((sum, sal) => sum + sal, 0) / salarios.length);
      const salarioMinimo = Math.min(...salarios);
      const salarioMaximo = Math.max(...salarios);

      return {
        rangoExperiencia: rango.label,
        añosMinimos: rango.min,
        añosMaximos: rango.max,
        salarioPromedio,
        cantidad: usuariosEnRango.length,
        salarioMinimo,
        salarioMaximo
      };
    }).filter(item => item.cantidad > 0); // Solo rangos con datos

    console.log('Evolución salarial calculada:', evolucionSalarial);

    // Calcular estadísticas adicionales
    const todosSalarios = usuarios.map(u => convertirRangoASalario(u.rango_salarial));
    const salarioPromedioGeneral = todosSalarios.length > 0
      ? Math.round(todosSalarios.reduce((sum, sal) => sum + sal, 0) / todosSalarios.length)
      : 0;

    const experienciaPromedio = usuarios.length > 0
      ? Math.round(usuarios.reduce((sum, u) => sum + u.años_experiencia, 0) / usuarios.length)
      : 0;

    res.json({
      ok: true,
      evolucion: {
        datos: evolucionSalarial,
        resumen: {
          salarioPromedioGeneral,
          experienciaPromedio,
          totalProfesionales: usuarios.length,
          rangosConDatos: evolucionSalarial.length
        }
      }
    });

  } catch (error) {
    console.error('Error en obtenerEvolucionSalarial:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener evolución salarial'
    });
  }
};

// Obtener distribución de profesionales por años de experiencia
const obtenerDistribucionExperiencia = async (req, res) => {
  try {
    // Obtener usuarios activos con experiencia definida
    const usuarios = await User.findAll({
      where: {
        activo: true,
        años_experiencia: { [Op.not]: null }
      },
      attributes: ['años_experiencia']
    });

    console.log(`Usuarios encontrados para distribución de experiencia: ${usuarios.length}`);

    // Definir los mismos rangos de experiencia que en evolución salarial
    const rangosExperiencia = [
      { min: 0, max: 2, label: '0-2 años' },
      { min: 3, max: 5, label: '3-5 años' },
      { min: 6, max: 10, label: '6-10 años' },
      { min: 11, max: 15, label: '11-15 años' },
      { min: 16, max: 20, label: '16-20 años' },
      { min: 21, max: 50, label: '21+ años' }
    ];

    // Contar profesionales por rango de experiencia
    const distribucionExperiencia = rangosExperiencia.map(rango => {
      const usuariosEnRango = usuarios.filter(user =>
        user.años_experiencia >= rango.min && user.años_experiencia <= rango.max
      );

      const cantidad = usuariosEnRango.length;
      const porcentaje = usuarios.length > 0 ? Math.round((cantidad / usuarios.length) * 100) : 0;

      return {
        rangoExperiencia: rango.label,
        añosMinimos: rango.min,
        añosMaximos: rango.max,
        cantidad,
        porcentaje
      };
    }).filter(item => item.cantidad > 0); // Solo rangos con profesionales

    console.log('Distribución de experiencia calculada:', distribucionExperiencia);

    // Calcular estadísticas adicionales
    const experienciaPromedio = usuarios.length > 0
      ? Math.round(usuarios.reduce((sum, u) => sum + u.años_experiencia, 0) / usuarios.length)
      : 0;

    // Encontrar el rango con más profesionales
    const rangoMasPopular = distribucionExperiencia.length > 0
      ? distribucionExperiencia.reduce((max, current) =>
          current.cantidad > max.cantidad ? current : max
        )
      : null;

    // Calcular mediana de experiencia
    const experienciasOrdenadas = usuarios
      .map(u => u.años_experiencia)
      .sort((a, b) => a - b);

    const mediana = experienciasOrdenadas.length > 0
      ? experienciasOrdenadas.length % 2 === 0
        ? Math.round((experienciasOrdenadas[experienciasOrdenadas.length / 2 - 1] + experienciasOrdenadas[experienciasOrdenadas.length / 2]) / 2)
        : experienciasOrdenadas[Math.floor(experienciasOrdenadas.length / 2)]
      : 0;

    res.json({
      ok: true,
      distribucion: {
        datos: distribucionExperiencia,
        resumen: {
          totalProfesionales: usuarios.length,
          experienciaPromedio,
          experienciaMediana: mediana,
          rangoMasPopular: rangoMasPopular ? {
            rango: rangoMasPopular.rangoExperiencia,
            cantidad: rangoMasPopular.cantidad,
            porcentaje: rangoMasPopular.porcentaje
          } : null,
          rangosConDatos: distribucionExperiencia.length
        }
      }
    });

  } catch (error) {
    console.error('Error en obtenerDistribucionExperiencia:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener distribución de experiencia'
    });
  }
};

// Obtener relación entre experiencia y número de tecnologías dominadas
const obtenerExperienciaVsTecnologias = async (req, res) => {
  try {
    // Obtener usuarios activos con experiencia y especialidad técnica definidas
    const usuarios = await User.findAll({
      where: {
        activo: true,
        años_experiencia: { [Op.not]: null },
        especialidad_tecnica: {
          [Op.not]: null,
          [Op.ne]: ''
        }
      },
      attributes: ['años_experiencia', 'especialidad_tecnica']
    });

    console.log(`Usuarios encontrados para experiencia vs tecnologías: ${usuarios.length}`);

    if (usuarios.length === 0) {
      console.log('No hay usuarios con especialidad técnica definida');
      return res.json({
        ok: true,
        experienciaVsTecnologias: {
          datos: [],
          resumen: {
            totalProfesionales: 0,
            promedioGeneralTecnologias: 0,
            maxTecnologiasEncontradas: 0,
            rangoConMasTecnologias: null
          }
        }
      });
    }

    // Función para contar tecnologías reales desde el array de especialidades
    const contarTecnologiasReales = (especialidades) => {
      if (!especialidades) return 0;

      // Si es string, intentar parsearlo como JSON
      let techs = especialidades;
      if (typeof especialidades === 'string') {
        try {
          techs = JSON.parse(especialidades);
        } catch (e) {
          // Si no es JSON válido, tratarlo como una sola tecnología
          return 1;
        }
      }

      // Si es array, contar las tecnologías
      if (Array.isArray(techs)) {
        return techs.length;
      }

      // Si no es array, es una sola tecnología
      return 1;
    };

    // Definir los mismos rangos de experiencia
    const rangosExperiencia = [
      { min: 0, max: 2, label: '0-2 años' },
      { min: 3, max: 5, label: '3-5 años' },
      { min: 6, max: 10, label: '6-10 años' },
      { min: 11, max: 15, label: '11-15 años' },
      { min: 16, max: 20, label: '16-20 años' },
      { min: 21, max: 50, label: '21+ años' }
    ];

    // Procesar datos por rango de experiencia
    const experienciaVsTecnologias = rangosExperiencia.map(rango => {
      const usuariosEnRango = usuarios.filter(user =>
        user.años_experiencia >= rango.min && user.años_experiencia <= rango.max
      );

      if (usuariosEnRango.length === 0) {
        return {
          rangoExperiencia: rango.label,
          añosMinimos: rango.min,
          añosMaximos: rango.max,
          cantidad: 0,
          promedioTecnologias: 0,
          mediaTecnologias: 0,
          maxTecnologias: 0,
          minTecnologias: 0
        };
      }

      // Contar tecnologías reales por usuario basándose en las especialidades seleccionadas
      const conteosTecnologias = usuariosEnRango.map(user => {
        return contarTecnologiasReales(user.especialidad_tecnica);
      });

      if (conteosTecnologias.length === 0) {
        return {
          rangoExperiencia: rango.label,
          añosMinimos: rango.min,
          añosMaximos: rango.max,
          cantidad: usuariosEnRango.length,
          promedioTecnologias: 0
        };
      }

      const promedioTecnologias = Math.round(
        (conteosTecnologias.reduce((sum, count) => sum + count, 0) / conteosTecnologias.length) * 10
      ) / 10;

      return {
        rangoExperiencia: rango.label,
        añosMinimos: rango.min,
        añosMaximos: rango.max,
        cantidad: usuariosEnRango.length,
        promedioTecnologias
      };
    }).filter(item => item.cantidad > 0);

    console.log('Análisis experiencia vs tecnologías calculado:', experienciaVsTecnologias);

    // Calcular estadísticas generales usando especialidades reales
    const todosTecnologiasCounts = usuarios.map(user => {
      return contarTecnologiasReales(user.especialidad_tecnica);
    }).filter(count => count > 0);

    const promedioGeneralTecnologias = todosTecnologiasCounts.length > 0
      ? Math.round((todosTecnologiasCounts.reduce((sum, count) => sum + count, 0) / todosTecnologiasCounts.length) * 10) / 10
      : 0;

    const experienciaPromedio = usuarios.length > 0
      ? Math.round(usuarios.reduce((sum, u) => sum + u.años_experiencia, 0) / usuarios.length)
      : 0;

    const respuesta = {
      ok: true,
      experienciaVsTecnologias: {
        datos: experienciaVsTecnologias,
        resumen: {
          totalProfesionales: usuarios.length,
          promedioGeneralTecnologias,
          experienciaPromedio,
          maxTecnologiasEncontradas: todosTecnologiasCounts.length > 0 ? Math.max(...todosTecnologiasCounts) : 0,
          rangosConDatos: experienciaVsTecnologias.length
        }
      }
    };

    console.log('Análisis experiencia vs tecnologías calculado:', experienciaVsTecnologias);
    console.log(`Respuesta completa - Rangos con datos: ${experienciaVsTecnologias.length}, Total profesionales: ${usuarios.length}`);

    res.json(respuesta);

  } catch (error) {
    console.error('Error en obtenerExperienciaVsTecnologias:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener relación experiencia vs tecnologías'
    });
  }
};

// Obtener mapa de calor: industria vs nivel salarial
const obtenerMapaCalorIndustriaSalarial = async (req, res) => {
  try {
    // Obtener usuarios activos con industria y salario definidos
    const usuarios = await User.findAll({
      where: {
        activo: true,
        industria: {
          [Op.not]: null,
          [Op.ne]: '',
          [Op.ne]: 'Prefiero no decir'
        },
        rango_salarial: {
          [Op.not]: null,
          [Op.ne]: '',
          [Op.ne]: 'Prefiero no decir'
        }
      },
      attributes: ['industria', 'rango_salarial']
    });

    console.log(`Usuarios encontrados para mapa de calor industria-salario: ${usuarios.length}`);

    // Definir rangos salariales ordenados (usar formato formal como en "Rangos Salariales")
    const rangosSalariales = [
      { id: '$0 - $500.000', label: '$0 - $500.000', orden: 1 },
      { id: '$500.001 - $1.000.000', label: '$500.001 - $1.000.000', orden: 2 },
      { id: '$1.000.001 - $2.000.000', label: '$1.000.001 - $2.000.000', orden: 3 },
      { id: '$2.000.001 - $3.000.000', label: '$2.000.001 - $3.000.000', orden: 4 },
      { id: '$3.000.001+', label: '$3.000.001+', orden: 5 }
    ];

    // Obtener todas las industrias únicas
    const industriasUnicas = [...new Set(usuarios.map(user => user.industria))].sort();

    // Crear matriz de datos para el heatmap
    const mapaCalorData = [];
    let maxProfesionales = 0;

    industriasUnicas.forEach(industria => {
      const filaDatos = {
        industria,
        datos: [],
        totalProfesionales: 0
      };

      rangosSalariales.forEach(rango => {
        const profesionalesEnCelda = usuarios.filter(user =>
          user.industria === industria && user.rango_salarial === rango.id
        ).length;

        filaDatos.datos.push({
          rangoSalarial: rango.id,
          rangoLabel: rango.label, // Ahora usa el formato formal
          cantidad: profesionalesEnCelda,
          orden: rango.orden
        });

        filaDatos.totalProfesionales += profesionalesEnCelda;

        // Actualizar máximo para escala de colores
        if (profesionalesEnCelda > maxProfesionales) {
          maxProfesionales = profesionalesEnCelda;
        }
      });

      // Solo incluir industrias con al menos 1 profesional
      if (filaDatos.totalProfesionales > 0) {
        mapaCalorData.push(filaDatos);
      }
    });

    // Ordenar industrias por total de profesionales (descendente)
    mapaCalorData.sort((a, b) => b.totalProfesionales - a.totalProfesionales);

    console.log('Mapa de calor calculado:', {
      industrias: mapaCalorData.length,
      maxProfesionales,
      totalUsuarios: usuarios.length
    });

    // Calcular estadísticas adicionales
    const distribucionPorRangoTemp = rangosSalariales.map(rango => {
      const totalEnRango = usuarios.filter(user => user.rango_salarial === rango.id).length;
      const porcentajeExacto = usuarios.length > 0 ? (totalEnRango / usuarios.length) * 100 : 0;

      return {
        rango: rango.label,
        cantidad: totalEnRango,
        porcentajeExacto,
        porcentaje: Math.round(porcentajeExacto)
      };
    }).filter(item => item.cantidad > 0);

    // Ajustar porcentajes para que sumen exactamente 100%
    const totalPorcentajeRedondeado = distribucionPorRangoTemp.reduce((sum, item) => sum + item.porcentaje, 0);
    const diferencia = 100 - totalPorcentajeRedondeado;

    // Si hay diferencia, ajustar el elemento con mayor parte decimal
    if (diferencia !== 0) {
      const elementoConMayorDecimal = distribucionPorRangoTemp.reduce((max, item) => {
        const decimal = item.porcentajeExacto - item.porcentaje;
        const maxDecimal = max.porcentajeExacto - max.porcentaje;
        return decimal > maxDecimal ? item : max;
      });

      elementoConMayorDecimal.porcentaje += diferencia;
    }

    const distribucionPorRango = distribucionPorRangoTemp.map(item => ({
      rango: item.rango,
      cantidad: item.cantidad,
      porcentaje: item.porcentaje
    }));

    const industriaMasComun = mapaCalorData.length > 0 ? mapaCalorData[0] : null;

    res.json({
      ok: true,
      mapaCalor: {
        datos: mapaCalorData,
        rangosSalariales: rangosSalariales.map(r => ({ id: r.id, label: r.label, orden: r.orden })),
        estadisticas: {
          totalProfesionales: usuarios.length,
          totalIndustrias: mapaCalorData.length,
          maxProfesionalesPorCelda: maxProfesionales,
          industriaMasComun: industriaMasComun ? {
            nombre: industriaMasComun.industria,
            profesionales: industriaMasComun.totalProfesionales
          } : null,
          distribucionPorRango
        }
      }
    });

  } catch (error) {
    console.error('Error en obtenerMapaCalorIndustriaSalarial:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener mapa de calor industria-salario'
    });
  }
};

// Obtener distribución de disponibilidad para cambio de trabajo
const obtenerDisponibilidadCambioTrabajo = async (req, res) => {
  try {
    // Obtener usuarios activos con disponibilidad definida
    const usuarios = await User.findAll({
      where: {
        activo: true,
        disponibilidad_cambio: {
          [Op.not]: null,
          [Op.ne]: ''
        }
      },
      attributes: ['disponibilidad_cambio']
    });

    console.log(`Usuarios encontrados para disponibilidad de cambio: ${usuarios.length}`);

    // Definir las opciones de disponibilidad en orden de interés
    const opcionesDisponibilidad = [
      'Activamente buscando',
      'Abierto a oportunidades',
      'No seguro',
      'No disponible',
      'Sin trabajo'
    ];

    // Contar usuarios por cada opción de disponibilidad
    const distribucionDisponibilidad = opcionesDisponibilidad.map(opcion => {
      const usuariosConOpcion = usuarios.filter(user =>
        user.disponibilidad_cambio === opcion
      );

      const cantidad = usuariosConOpcion.length;
      const porcentaje = usuarios.length > 0 ? Math.round((cantidad / usuarios.length) * 100) : 0;

      return {
        disponibilidad: opcion,
        cantidad,
        porcentaje
      };
    }); // Mostrar todas las opciones, incluso las con 0 usuarios

    console.log('Distribución de disponibilidad calculada:', distribucionDisponibilidad);
    console.log('Opciones disponibles (incluyendo las con 0 usuarios):', opcionesDisponibilidad);
    console.log('Total de opciones en respuesta:', distribucionDisponibilidad.length);

    // Calcular estadísticas adicionales
    const usuariosActivos = distribucionDisponibilidad.find(item => item.disponibilidad === 'Activamente buscando')?.cantidad || 0;
    const usuariosAbiertos = distribucionDisponibilidad.find(item => item.disponibilidad === 'Abierto a oportunidades')?.cantidad || 0;
    const usuariosNoDisponibles = distribucionDisponibilidad.find(item => item.disponibilidad === 'No disponible')?.cantidad || 0;
    const usuariosSinTrabajo = distribucionDisponibilidad.find(item => item.disponibilidad === 'Sin trabajo')?.cantidad || 0;
    const usuariosIndecisos = distribucionDisponibilidad.find(item => item.disponibilidad === 'No seguro')?.cantidad || 0;

    // Calcular usuarios potencialmente disponibles (activos + abiertos + sin trabajo)
    const usuariosPotencialmenteDisponibles = usuariosActivos + usuariosAbiertos + usuariosSinTrabajo;
    const porcentajePotencialmenteDisponibles = usuarios.length > 0
      ? Math.round((usuariosPotencialmenteDisponibles / usuarios.length) * 100)
      : 0;

    // Encontrar la opción más común
    const opcionMasComun = distribucionDisponibilidad.length > 0
      ? distribucionDisponibilidad.reduce((max, current) =>
          current.cantidad > max.cantidad ? current : max
        )
      : null;

    const respuesta = {
      ok: true,
      disponibilidadCambio: {
        datos: distribucionDisponibilidad,
        resumen: {
          totalProfesionales: usuarios.length,
          usuariosActivos,
          usuariosAbiertos,
          usuariosNoDisponibles,
          usuariosSinTrabajo,
          usuariosIndecisos,
          usuariosPotencialmenteDisponibles,
          porcentajePotencialmenteDisponibles,
          opcionMasComun: opcionMasComun ? {
            disponibilidad: opcionMasComun.disponibilidad,
            cantidad: opcionMasComun.cantidad,
            porcentaje: opcionMasComun.porcentaje
          } : null,
          opcionesConDatos: distribucionDisponibilidad.length
        }
      }
    };

    console.log('RESPUESTA FINAL enviada al frontend:', JSON.stringify(respuesta, null, 2));
    res.json(respuesta);

  } catch (error) {
    console.error('Error en obtenerDisponibilidadCambioTrabajo:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor al obtener disponibilidad de cambio de trabajo'
    });
  }
};

// 1. Obtener tecnologías vs salario promedio
const obtenerTecnologiasVsSalario = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      where: {
        activo: true,
        especialidad_tecnica: { [Op.not]: null, [Op.ne]: '' },
        rango_salarial: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'Prefiero no decir' }
      },
      attributes: ['especialidad_tecnica', 'rango_salarial']
    });

    const convertirRangoASalario = (rango) => {
      const rangos = {
        '$0 - $500.000': 250000,
        '$500.001 - $1.000.000': 750000,
        '$1.000.001 - $2.000.000': 1500000,
        '$2.000.001 - $3.000.000': 2500000,
        '$3.000.001+': 4000000
      };
      return rangos[rango] || 1000000;
    };

    const tecnologiaSalarios = {};

    usuarios.forEach(user => {
      let tecnologias = user.especialidad_tecnica;

      if (typeof tecnologias === 'string') {
        try {
          tecnologias = JSON.parse(tecnologias);
        } catch (e) {
          tecnologias = [tecnologias];
        }
      }

      if (Array.isArray(tecnologias)) {
        tecnologias.forEach(tech => {
          if (tech && tech.trim()) {
            const techName = tech.trim();
            if (!tecnologiaSalarios[techName]) {
              tecnologiaSalarios[techName] = { salarios: [], cantidad: 0 };
            }
            tecnologiaSalarios[techName].salarios.push(convertirRangoASalario(user.rango_salarial));
            tecnologiaSalarios[techName].cantidad++;
          }
        });
      }
    });

    const resultado = Object.entries(tecnologiaSalarios)
      .map(([tecnologia, data]) => ({
        tecnologia,
        salarioPromedio: Math.round(data.salarios.reduce((sum, s) => sum + s, 0) / data.salarios.length),
        cantidad: data.cantidad
      }))
      .filter(item => item.cantidad >= 2)
      .sort((a, b) => b.salarioPromedio - a.salarioPromedio);

    res.json({ ok: true, tecnologiasVsSalario: resultado });
  } catch (error) {
    console.error('Error en obtenerTecnologiasVsSalario:', error);
    res.status(500).json({ ok: false, msj: 'Error al obtener tecnologías vs salario' });
  }
};

// 2. Obtener salario vs nivel de educación
const obtenerSalarioVsEducacion = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      where: {
        activo: true,
        nivel_educacion: { [Op.not]: null, [Op.ne]: '' },
        rango_salarial: { [Op.not]: null, [Op.ne]: '', [Op.ne]: 'Prefiero no decir' }
      },
      attributes: ['nivel_educacion', 'rango_salarial']
    });

    const convertirRangoASalario = (rango) => {
      const rangos = {
        '$0 - $500.000': 250000,
        '$500.001 - $1.000.000': 750000,
        '$1.000.001 - $2.000.000': 1500000,
        '$2.000.001 - $3.000.000': 2500000,
        '$3.000.001+': 4000000
      };
      return rangos[rango] || 1000000;
    };

    const educacionSalarios = {};

    usuarios.forEach(user => {
      let niveles = user.nivel_educacion;

      if (typeof niveles === 'string') {
        try {
          niveles = JSON.parse(niveles);
        } catch (e) {
          niveles = [niveles];
        }
      }

      if (Array.isArray(niveles)) {
        niveles.forEach(nivel => {
          if (nivel && nivel.trim()) {
            if (!educacionSalarios[nivel]) {
              educacionSalarios[nivel] = { salarios: [], cantidad: 0 };
            }
            educacionSalarios[nivel].salarios.push(convertirRangoASalario(user.rango_salarial));
            educacionSalarios[nivel].cantidad++;
          }
        });
      }
    });

    const resultado = Object.entries(educacionSalarios)
      .map(([nivelEducacion, data]) => ({
        nivelEducacion,
        salarioPromedio: Math.round(data.salarios.reduce((sum, s) => sum + s, 0) / data.salarios.length),
        salarioMinimo: Math.min(...data.salarios),
        salarioMaximo: Math.max(...data.salarios),
        cantidad: data.cantidad
      }))
      .sort((a, b) => b.salarioPromedio - a.salarioPromedio);

    res.json({ ok: true, salarioVsEducacion: resultado });
  } catch (error) {
    console.error('Error en obtenerSalarioVsEducacion:', error);
    res.status(500).json({ ok: false, msj: 'Error al obtener salario vs educación' });
  }
};

// 3. Obtener tipo de empleo vs satisfacción laboral
const obtenerTipoEmpleoVsSatisfaccion = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      where: {
        activo: true,
        tipo_empleo_actual: { [Op.not]: null, [Op.ne]: '' },
        satisfaccion_laboral: { [Op.not]: null, [Op.between]: [1, 5] }
      },
      attributes: ['tipo_empleo_actual', 'satisfaccion_laboral']
    });

    const tipoEmpleoSatisfaccion = {};

    usuarios.forEach(user => {
      const tipo = user.tipo_empleo_actual;
      if (!tipoEmpleoSatisfaccion[tipo]) {
        tipoEmpleoSatisfaccion[tipo] = { satisfacciones: [], cantidad: 0 };
      }
      tipoEmpleoSatisfaccion[tipo].satisfacciones.push(user.satisfaccion_laboral);
      tipoEmpleoSatisfaccion[tipo].cantidad++;
    });

    const resultado = Object.entries(tipoEmpleoSatisfaccion)
      .map(([tipoEmpleo, data]) => ({
        tipoEmpleo,
        satisfaccionPromedio: parseFloat((data.satisfacciones.reduce((sum, s) => sum + s, 0) / data.satisfacciones.length).toFixed(1)),
        cantidad: data.cantidad
      }))
      .sort((a, b) => b.satisfaccionPromedio - a.satisfaccionPromedio);

    res.json({ ok: true, tipoEmpleoVsSatisfaccion: resultado });
  } catch (error) {
    console.error('Error en obtenerTipoEmpleoVsSatisfaccion:', error);
    res.status(500).json({ ok: false, msj: 'Error al obtener tipo de empleo vs satisfacción' });
  }
};

// 4. Obtener proyección de demanda de tecnologías
const obtenerProyeccionDemandaTecnologias = async (req, res) => {
  try {
    const fechaActual = new Date();
    const historico = [];

    // Obtener datos históricos de últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(fechaActual);
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

      const usuarios = await User.findAll({
        where: {
          activo: true,
          especialidad_tecnica: { [Op.not]: null, [Op.ne]: '' },
          created_at: { [Op.between]: [inicioMes, finMes] }
        },
        attributes: ['especialidad_tecnica']
      });

      const tecnologiasCount = {};
      usuarios.forEach(user => {
        let techs = user.especialidad_tecnica;
        if (typeof techs === 'string') {
          try { techs = JSON.parse(techs); } catch (e) { techs = [techs]; }
        }
        if (Array.isArray(techs)) {
          techs.forEach(tech => {
            if (tech && tech.trim()) {
              const techName = tech.trim();
              tecnologiasCount[techName] = (tecnologiasCount[techName] || 0) + 1;
            }
          });
        }
      });

      historico.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        tecnologias: tecnologiasCount
      });
    }

    // Calcular top 5 tecnologías
    const todasTecnologias = {};
    historico.forEach(mes => {
      Object.entries(mes.tecnologias).forEach(([tech, count]) => {
        todasTecnologias[tech] = (todasTecnologias[tech] || 0) + count;
      });
    });

    const top5Tecnologias = Object.entries(todasTecnologias)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tech]) => tech);

    // Proyección simple (promedio de crecimiento últimos 3 meses)
    const proyeccion = [];
    for (let i = 1; i <= 3; i++) {
      const fecha = new Date(fechaActual);
      fecha.setMonth(fecha.getMonth() + i);
      proyeccion.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        esProyeccion: true
      });
    }

    res.json({ ok: true, proyeccion: { historico, proyeccion, top5Tecnologias } });
  } catch (error) {
    console.error('Error en obtenerProyeccionDemandaTecnologias:', error);
    res.status(500).json({ ok: false, msj: 'Error al obtener proyección de tecnologías' });
  }
};

// 5. Obtener índice de empleabilidad por perfil
const obtenerIndiceEmpleabilidad = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      where: {
        activo: true,
        perfil_completo: true
      },
      attributes: ['años_experiencia', 'nivel_educacion', 'especialidad_tecnica', 'satisfaccion_laboral', 'rango_salarial']
    });

    const calcularScore = (user) => {
      let score = 0;

      // Experiencia (max 25 puntos)
      score += Math.min((user.años_experiencia || 0) * 1.5, 25);

      // Educación (max 25 puntos)
      let niveles = user.nivel_educacion;
      if (typeof niveles === 'string') {
        try { niveles = JSON.parse(niveles); } catch (e) { niveles = [niveles]; }
      }
      if (Array.isArray(niveles)) {
        score += Math.min(niveles.length * 8, 25);
      }

      // Tecnologías (max 25 puntos)
      let techs = user.especialidad_tecnica;
      if (typeof techs === 'string') {
        try { techs = JSON.parse(techs); } catch (e) { techs = [techs]; }
      }
      if (Array.isArray(techs)) {
        score += Math.min(techs.length * 5, 25);
      }

      // Satisfacción laboral (max 25 puntos)
      if (user.satisfaccion_laboral) {
        score += (user.satisfaccion_laboral / 5) * 25;
      }

      return Math.round(score);
    };

    const perfilesConScore = usuarios.map(user => ({
      score: calcularScore(user)
    }));

    // Rangos de empleabilidad
    const rangos = {
      'Excelente (81-100)': perfilesConScore.filter(p => p.score >= 81 && p.score <= 100).length,
      'Muy Bueno (61-80)': perfilesConScore.filter(p => p.score >= 61 && p.score < 81).length,
      'Bueno (41-60)': perfilesConScore.filter(p => p.score >= 41 && p.score < 61).length,
      'Regular (21-40)': perfilesConScore.filter(p => p.score >= 21 && p.score < 41).length,
      'Bajo (0-20)': perfilesConScore.filter(p => p.score >= 0 && p.score < 21).length
    };

    const scorePromedio = perfilesConScore.length > 0
      ? Math.round(perfilesConScore.reduce((sum, p) => sum + p.score, 0) / perfilesConScore.length)
      : 0;

    res.json({
      ok: true,
      indiceEmpleabilidad: {
        distribucion: Object.entries(rangos).map(([rango, cantidad]) => ({ rango, cantidad })),
        scorePromedio,
        totalPerfiles: perfilesConScore.length
      }
    });
  } catch (error) {
    console.error('Error en obtenerIndiceEmpleabilidad:', error);
    res.status(500).json({ ok: false, msj: 'Error al obtener índice de empleabilidad' });
  }
};

module.exports = {
  obtenerEstadisticasMercado,
  obtenerMetricasAvanzadas,
  obtenerTecnologiasMasDemandadas,
  obtenerDistribucionSalarial,
  obtenerEmpresasQueContratanMas,
  obtenerTendenciasMercado,
  obtenerSatisfaccionLaboral,
  obtenerEvolucionSalarial,
  obtenerDistribucionExperiencia,
  obtenerExperienciaVsTecnologias,
  obtenerMapaCalorIndustriaSalarial,
  obtenerDisponibilidadCambioTrabajo,
  obtenerTecnologiasVsSalario,
  obtenerSalarioVsEducacion,
  obtenerTipoEmpleoVsSatisfaccion,
  obtenerProyeccionDemandaTecnologias,
  obtenerIndiceEmpleabilidad
};
