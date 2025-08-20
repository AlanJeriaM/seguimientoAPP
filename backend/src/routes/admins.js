const express = require('express');
const router = express.Router();
const {
  obtenerAdministradores,
  obtenerAdministradoresEliminados,
  crearAdministrador,
  obtenerAdministradorPorId,
  actualizarAdministrador,
  desactivarAdministrador,
  reactivarAdministrador,
  eliminarAdministradorPermanentemente
} = require('../controllers/adminController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y permisos de administrador
router.use(verificarToken);
router.use(verificarAdmin);

// CRUD de administradores
router.get('/', obtenerAdministradores);
router.get('/eliminados', obtenerAdministradoresEliminados);
router.post('/', crearAdministrador);
router.get('/:id', obtenerAdministradorPorId);
router.put('/:id', actualizarAdministrador);
router.delete('/:id', desactivarAdministrador);
router.put('/reactivar/:id', reactivarAdministrador);
router.delete('/eliminar-permanente/:id', eliminarAdministradorPermanentemente);

module.exports = router;
