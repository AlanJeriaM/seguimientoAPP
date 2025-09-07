const express = require('express');
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const encuestaController = require('../controllers/encuestaController');
const respuestaController = require('../controllers/respuestaController');
const reporteController = require('../controllers/reporteController');

// Rutas para administradores (requieren autenticación y rol admin)
router.use(verificarToken);
router.use(verificarAdmin);

// CRUD de encuestas
router.post('/', encuestaController.crearEncuesta);
router.get('/', encuestaController.obtenerEncuestas);
router.get('/eliminadas', encuestaController.obtenerEncuestasEliminadas);
router.get('/:id', encuestaController.obtenerEncuestaPorId);
router.put('/:id', encuestaController.actualizarEncuesta);
router.delete('/:id', encuestaController.eliminarEncuesta);
router.put('/reactivar/:id', encuestaController.reactivarEncuesta);
router.delete('/eliminar-permanente/:id', encuestaController.eliminarEncuestaPermanentemente);

// Reportes y analíticas
router.get('/reportes/estadisticas-generales', reporteController.obtenerEstadisticasGenerales);
router.get('/reportes/tendencias', reporteController.obtenerTendenciasParticipacion);
router.get('/reportes/comparacion', reporteController.obtenerComparacionEncuestas);
router.get('/:id/reporte', reporteController.obtenerReporteEncuesta);
router.get('/:id/exportar', reporteController.exportarDatosEncuesta);

module.exports = router;

