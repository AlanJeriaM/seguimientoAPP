const express = require('express');
const router = express.Router();
const { verificarToken, verificarCliente } = require('../middleware/auth');
const respuestaController = require('../controllers/respuestaController');

// Rutas para usuarios (requieren autenticación y rol cliente)
router.use(verificarToken);
router.use(verificarCliente);

// Obtener encuestas disponibles
router.get('/encuestas-disponibles', respuestaController.obtenerEncuestasDisponibles);

// Obtener encuesta para responder
router.get('/encuesta/:id', respuestaController.obtenerEncuestaParaResponder);

// Enviar respuestas
router.post('/encuesta/:id/respuestas', respuestaController.enviarRespuestas);

// Historial de encuestas respondidas
router.get('/historial', respuestaController.obtenerHistorialEncuestas);

// Notificaciones
router.get('/notificaciones', respuestaController.obtenerNotificaciones);
router.put('/notificaciones/:id/leida', respuestaController.marcarNotificacionLeida);

module.exports = router;

