const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  renovarToken,
  getLinkedInAuthUrl,
  linkedinCallback,
  loginLinkedIn,
  enviarCodigoRestablecimiento,
  verificarCodigoRestablecimiento,
  restablecerContrasenia
} = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

// Rutas públicas
router.post('/login', loginAdmin);
router.post('/linkedin', loginLinkedIn); // Para desarrollo/simulación
router.get('/linkedin/auth-url', getLinkedInAuthUrl); // Nueva ruta
router.get('/linkedin/callback', linkedinCallback); // Nueva ruta

// Rutas para restablecer contraseña (públicas)
router.post('/send-reset-code', enviarCodigoRestablecimiento);
router.post('/verify-reset-code', verificarCodigoRestablecimiento);
router.post('/reset-password', restablecerContrasenia);

// Rutas protegidas
router.get('/renew', verificarToken, renovarToken);

module.exports = router;
