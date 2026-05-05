const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/dashboardController');
const { verificarToken, verificarAdminOCliente } = require('../middleware/auth');

// Rutas del dashboard (accesibles para admin y usuario)
router.get('/estadisticas-mercado', verificarToken, verificarAdminOCliente, obtenerEstadisticasMercado);

router.get('/metricas-avanzadas', verificarToken, verificarAdminOCliente, obtenerMetricasAvanzadas);

router.get('/tecnologias-demandadas', verificarToken, verificarAdminOCliente, obtenerTecnologiasMasDemandadas);
router.get('/distribucion-salarial', verificarToken, verificarAdminOCliente, obtenerDistribucionSalarial);
router.get('/empresas-contratan', verificarToken, verificarAdminOCliente, obtenerEmpresasQueContratanMas);
router.get('/tendencias-mercado', verificarToken, verificarAdminOCliente, obtenerTendenciasMercado);
router.get('/satisfaccion-laboral', verificarToken, verificarAdminOCliente, obtenerSatisfaccionLaboral);
router.get('/evolucion-salarial', verificarToken, verificarAdminOCliente, obtenerEvolucionSalarial);
router.get('/distribucion-experiencia', verificarToken, verificarAdminOCliente, obtenerDistribucionExperiencia);
router.get('/experiencia-vs-tecnologias', verificarToken, verificarAdminOCliente, obtenerExperienciaVsTecnologias);
router.get('/mapa-calor-industria-salarial', verificarToken, verificarAdminOCliente, obtenerMapaCalorIndustriaSalarial);
router.get('/disponibilidad-cambio-trabajo', verificarToken, verificarAdminOCliente, obtenerDisponibilidadCambioTrabajo);

// Nuevas rutas para gráficos avanzados
router.get('/tecnologias-vs-salario', verificarToken, verificarAdminOCliente, obtenerTecnologiasVsSalario);
router.get('/salario-vs-educacion', verificarToken, verificarAdminOCliente, obtenerSalarioVsEducacion);
router.get('/tipo-empleo-vs-satisfaccion', verificarToken, verificarAdminOCliente, obtenerTipoEmpleoVsSatisfaccion);
router.get('/proyeccion-demanda-tecnologias', verificarToken, verificarAdminOCliente, obtenerProyeccionDemandaTecnologias);
router.get('/indice-empleabilidad', verificarToken, verificarAdminOCliente, obtenerIndiceEmpleabilidad);

module.exports = router;
