const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

// Arrays de datos de prueba
const nombres = [
  'Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana Martínez', 'Luis Fernández',
  'Carmen López', 'José García', 'Isabel Sánchez', 'Miguel Ruiz', 'Elena Díaz',
  'Antonio Jiménez', 'Laura Moreno', 'Francisco Herrera', 'Mónica Vargas', 'David Castro',
  'Patricia Ramos', 'Roberto Morales', 'Sandra Romero', 'Fernando Navarro', 'Cristina Ortega',
  'Javier Delgado', 'Natalia Vega', 'Álvaro Mendoza', 'Beatriz Guerrero', 'Sergio Campos',
  'Lucía Medina', 'Rubén Herrera', 'Adriana Peña', 'Iván Rojas', 'Silvia Aguilar',
  'Manuel Flores', 'Raquel Blanco', 'Alejandro Gutiérrez', 'Eva Molina', 'Gabriel Serrano',
  'Claudia Marín', 'Óscar Iglesias', 'Andrea León', 'Pablo Cabrera', 'Marina Esteban',
  'Héctor Moya', 'Nerea Parra', 'Rubén Gallego', 'Cristina Pardo', 'Daniel Santos',
  'Paula Fuentes', 'Marcos Vázquez', 'Natalia Ramos', 'Adrián Carmona', 'Sara Cortés'
];

const empresas = [
  'google', 'microsoft', 'amazon', 'facebook', 'apple', 'netflix', 'spotify', 'uber',
  'tesla', 'spacex', 'airbnb', 'paypal', 'stripe', 'shopify', 'zoom', 'slack',
  'github', 'gitlab', 'atlassian', 'docker', 'kubernetes', 'red hat', 'oracle',
  'ibm', 'salesforce', 'adobe', 'intel', 'nvidia', 'amd', 'cisco', 'vmware',
  'accenture', 'deloitte', 'pwc', 'kpmg', 'ey', 'mckinsey', 'bain', 'bcg',
  'startup chile', 'cornershop', 'kushki', 'mach', 'notco', 'fintual', 'betterfly',
  'santander', 'bci', 'itau', 'falabella', 'ripley', 'paris', 'hites', 'johnson & johnson'
];

const industrias = [
  'tecnología de la información y servicios', 'servicios financieros', 'consultoría de gestión',
  'educación', 'salud y bienestar', 'retail', 'manufactura', 'telecomunicaciones',
  'medios y comunicación', 'energía y servicios públicos', 'construcción', 'turismo y hostelería',
  'transporte y logística', 'automoviles', 'biotecnología', 'farmacéutica',
  'seguros', 'inmobiliaria', 'agroindustria', 'minería'
];

const tecnologias = [
  'javascript', 'python', 'java', 'c#', 'php', 'typescript', 'react', 'angular',
  'vue.js', 'node.js', '.net', 'spring', 'laravel', 'django', 'ruby on rails',
  'go', 'rust', 'kotlin', 'swift', 'flutter', 'react native', 'mongodb', 'mysql',
  'postgresql', 'redis', 'elasticsearch', 'docker', 'kubernetes', 'aws', 'azure',
  'gcp', 'terraform', 'jenkins', 'gitlab ci', 'graphql', 'rest api', 'microservicios'
];

const nivelesEducacion = [
  'sin especialización', 'técnico', 'profesional', 'diplomado', 'postítulo',
  'magíster profesional', 'magíster académico', 'doctorado'
];

const areasInteres = [
  'frontend development', 'backend development', 'full stack development', 'devops',
  'data science', 'machine learning', 'mobile development', 'qa/testing',
  'ui/ux design', 'product management', 'project management', 'cybersecurity',
  'cloud computing', 'blockchain', 'iot', 'ar/vr', 'game development'
];

const rangosSalariales = [
  '0-500k', '500k-1M', '1M-1.5M', '1.5M-2M', '2M-3M', '3M+', 'Prefiero no decir'
];

const tiposEmpleo = [
  'Tiempo completo', 'Part-time', 'Freelance', 'Desempleado', 'Estudiante', 'Otro'
];

const disponibilidades = [
  'activamente buscando', 'abierto a oportunidades', 'no seguro',
  'no disponible', 'sin trabajo'
];

const ubicaciones = [
  'santiago, chile', 'valparaíso, chile', 'concepción, chile', 'la serena, chile',
  'antofagasta, chile', 'temuco, chile', 'iquique, chile', 'arica, chile',
  'puerto montt, chile', 'chillán, chile', 'rancagua, chile', 'talca, chile',
  'calama, chile', 'copiapo, chile', 'osorno, chile'
];

// Función para obtener un elemento aleatorio de un array
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

// Función para obtener múltiples elementos aleatorios de un array
const randomChoices = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Función para generar un correo único
const generateEmail = (nombre, index) => {
  const nombreLower = nombre.toLowerCase().replace(/\s+/g, '.');
  return `${nombreLower}${index}@test.com`;
};

// Función para generar un resumen profesional
const generateResumen = (nombre, tecnologiasSeleccionadas, areaInteres) => {
  const resumenes = [
    `Desarrollador ${areaInteres} con experiencia en ${tecnologiasSeleccionadas.slice(0, 3).join(', ')}. Apasionado por crear soluciones innovadoras y escalables.`,
    `Profesional ${areaInteres} especializado en ${tecnologiasSeleccionadas[0]}. Enfocado en entregar productos de alta calidad y experiencia de usuario excepcional.`,
    `Ingeniero de software con expertise en ${tecnologiasSeleccionadas.slice(0, 2).join(' y ')}. Comprometido con las mejores prácticas de desarrollo y arquitectura de software.`,
    `Desarrollador ${areaInteres} con sólidos conocimientos en ${tecnologiasSeleccionadas.slice(0, 4).join(', ')}. Buscando oportunidades para crecer profesionalmente.`
  ];
  return randomChoice(resumenes);
};

// Función principal para generar usuarios
const generateTestUsers = async () => {
  try {
    console.log('🚀 Iniciando generación de usuarios de prueba...');
    
    // Verificar si ya existen usuarios de prueba
    const existingTestUsers = await User.count({
      where: {
        correo: {
          [require('sequelize').Op.like]: '%@test.com'
        }
      }
    });

    if (existingTestUsers > 0) {
      console.log(`⚠️  Ya existen ${existingTestUsers} usuarios de prueba. ¿Deseas continuar? (S/N)`);
      // En un script automático, continuamos
    }

    const usersToCreate = [];
    
    for (let i = 0; i < 50; i++) {
      const nombre = nombres[i];
      const correo = generateEmail(nombre, i + 1);
      
      // Generar datos aleatorios pero realistas
      const empresaActual = randomChoice(empresas);
      const industria = randomChoice(industrias);
      const areaInteres = randomChoice(areasInteres);
      const tecnologiasSeleccionadas = randomChoices(tecnologias, Math.floor(Math.random() * 8) + 2); // 2-10 tecnologías
      const nivelEducacion = randomChoices(nivelesEducacion, Math.floor(Math.random() * 3) + 1); // 1-3 niveles
      const añosExperiencia = Math.floor(Math.random() * 15) + 1; // 1-15 años
      const rangoSalarial = randomChoice(rangosSalariales);
      const tipoEmpleo = randomChoice(tiposEmpleo);
      const disponibilidad = randomChoice(disponibilidades);
      const ubicacion = randomChoice(ubicaciones);
      const satisfaccionLaboral = Math.floor(Math.random() * 5) + 1; // 1-5
      
      // Generar opciones personalizadas (algunos usuarios tendrán opciones personalizadas)
      const opcionesPersonalizadas = {
        educacion: Math.random() < 0.2 ? [`nivel personalizado ${i + 1}`] : [],
        tecnologias: Math.random() < 0.3 ? [`tech personalizada ${i + 1}`] : [],
        areaInteres: Math.random() < 0.1 ? [`área personalizada ${i + 1}`] : [],
        industria: Math.random() < 0.15 ? [`industria personalizada ${i + 1}`] : []
      };

      const userData = {
        linkedin_id: `test_linkedin_${i + 1}_${Date.now()}`,
        nombre: nombre,
        correo: correo,
        contraseña: await bcrypt.hash('password123', 10), // Contraseña por defecto
        perfil_imagen_url: null,
        posicion_actual: `Desarrollador ${areaInteres}`,
        empresa_actual: empresaActual,
        ubicacion: ubicacion,
        resumen: generateResumen(nombre, tecnologiasSeleccionadas, areaInteres),
        industria: industria,
        ultimo_acceso: new Date(),
        fecha_registro: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Último año
        rol: 'usuario',
        activo: true,
        perfil_completo: true,
        años_experiencia: añosExperiencia,
        nivel_educacion: JSON.stringify(nivelEducacion),
        especialidad_tecnica: JSON.stringify(tecnologiasSeleccionadas),
        tipo_empleo_actual: tipoEmpleo,
        rango_salarial: rangoSalarial,
        disponibilidad_cambio: disponibilidad,
        tecnologias_principales: JSON.stringify(tecnologiasSeleccionadas.slice(0, 5)), // Top 5 tecnologías
        area_interes: areaInteres,
        satisfaccion_laboral: satisfaccionLaboral,
        opciones_personalizadas_educacion: JSON.stringify(opcionesPersonalizadas.educacion),
        opciones_personalizadas_tecnologias: JSON.stringify(opcionesPersonalizadas.tecnologias),
        opciones_personalizadas_area_interes: JSON.stringify(opcionesPersonalizadas.areaInteres),
        opciones_personalizadas_industria: JSON.stringify(opcionesPersonalizadas.industria),
        nombre_editado_manual: false
      };

      usersToCreate.push(userData);
    }

    // Crear usuarios en lotes para mejor rendimiento
    console.log('📝 Creando usuarios en la base de datos...');
    
    let createdCount = 0;
    for (let i = 0; i < usersToCreate.length; i += 10) {
      const batch = usersToCreate.slice(i, i + 10);
      await User.bulkCreate(batch);
      createdCount += batch.length;
      console.log(`✅ Creados ${createdCount}/${usersToCreate.length} usuarios`);
    }

    console.log('🎉 ¡Usuarios de prueba creados exitosamente!');
    console.log(`📊 Total de usuarios creados: ${createdCount}`);
    console.log(`📧 Correos generados: ${usersToCreate.slice(0, 5).map(u => u.correo).join(', ')}...`);
    console.log(`🔑 Contraseña por defecto para todos: password123`);
    console.log(`🏢 Empresas incluidas: ${[...new Set(usersToCreate.map(u => u.empresa_actual))].slice(0, 10).join(', ')}...`);
    console.log(`💻 Tecnologías incluidas: ${[...new Set(usersToCreate.flatMap(u => JSON.parse(u.especialidad_tecnica)))].slice(0, 15).join(', ')}...`);

  } catch (error) {
    console.error('❌ Error generando usuarios de prueba:', error);
  } finally {
    await sequelize.close();
  }
};

// Ejecutar el script
generateTestUsers();
