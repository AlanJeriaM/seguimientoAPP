const express = require('express');
const router = express.Router();
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  desactivarUsuario,
  obtenerMiPerfil,
  actualizarMiPerfil,
  actualizarUsuario,
  obtenerEstadisticas,
  obtenerUsuariosEliminados,
  reactivarUsuario,
  eliminarUsuarioPermanentemente
} = require('../controllers/userController');
const { verificarToken, verificarAdmin, verificarCliente } = require('../middleware/auth');

// Rutas para usuarios cliente
router.get('/mi-perfil', verificarToken, verificarCliente, obtenerMiPerfil);
router.put('/mi-perfil', verificarToken, verificarCliente, actualizarMiPerfil);

// Rutas para administradores
router.get('/', verificarToken, verificarAdmin, obtenerUsuarios);
router.get('/estadisticas', verificarToken, verificarAdmin, obtenerEstadisticas);
router.get('/eliminados', verificarToken, verificarAdmin, obtenerUsuariosEliminados);
router.get('/:id', verificarToken, verificarAdmin, obtenerUsuarioPorId);
router.put('/:id', verificarToken, verificarAdmin, actualizarUsuario);
router.delete('/:id', verificarToken, verificarAdmin, desactivarUsuario);
router.put('/reactivar/:id', verificarToken, verificarAdmin, reactivarUsuario);
router.delete('/eliminar-permanente/:id', verificarToken, verificarAdmin, eliminarUsuarioPermanentemente);


module.exports = router;
