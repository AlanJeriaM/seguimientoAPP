const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

const {
  obtenerEstadisticasMercado,
  obtenerTecnologiasMasDemandadas,
  obtenerDistribucionSalarial,
  obtenerEmpresasQueContratanMas,
  obtenerTendenciasMercado
} = require('../controllers/dashboardController');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/dashboard/estadisticas-mercado - Estadísticas generales del mercado
router.get('/estadisticas-mercado', obtenerEstadisticasMercado);

// GET /api/dashboard/tecnologias-demandadas - Tecnologías más demandadas
router.get('/tecnologias-demandadas', obtenerTecnologiasMasDemandadas);

// GET /api/dashboard/distribucion-salarial - Distribución salarial por industria
router.get('/distribucion-salarial', obtenerDistribucionSalarial);

// GET /api/dashboard/empresas-contratan - Empresas que más contratan
router.get('/empresas-contratan', obtenerEmpresasQueContratanMas);

// GET /api/dashboard/tendencias-mercado - Tendencias del mercado laboral
router.get('/tendencias-mercado', obtenerTendenciasMercado);

module.exports = router;
