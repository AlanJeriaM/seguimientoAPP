const express = require('express');
const router = express.Router();
const {
  obtenerEstadisticasMercado,
  obtenerMetricasAvanzadas,
  obtenerTecnologiasMasDemandadas,
  obtenerDistribucionSalarial,
  obtenerEmpresasQueContratanMas,
  obtenerTendenciasMercado
} = require('../controllers/dashboardController');
const { verificarToken, verificarAdminOCliente } = require('../middleware/auth');

// Rutas del dashboard (accesibles para admin y usuario)
router.get('/estadisticas-mercado', verificarToken, verificarAdminOCliente, obtenerEstadisticasMercado);

router.get('/metricas-avanzadas', verificarToken, verificarAdminOCliente, obtenerMetricasAvanzadas);

router.get('/tecnologias-demandadas', verificarToken, verificarAdminOCliente, obtenerTecnologiasMasDemandadas);
router.get('/distribucion-salarial', verificarToken, verificarAdminOCliente, obtenerDistribucionSalarial);
router.get('/empresas-contratan', verificarToken, verificarAdminOCliente, obtenerEmpresasQueContratanMas);
router.get('/tendencias-mercado', verificarToken, verificarAdminOCliente, obtenerTendenciasMercado);

module.exports = router;
