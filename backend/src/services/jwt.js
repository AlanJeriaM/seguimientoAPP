const jwt = require('jsonwebtoken');

// Generar JWT
const generarJWT = (id, nombreUsuario, rol) => {
  return new Promise((resolve, reject) => {
    const payload = {
      id,
      nombreUsuario,
      rol
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: '24h' // Token expira en 24 horas
      },
      (error, token) => {
        if (error) {
          console.log('Error al generar JWT:', error);
          reject('No se pudo generar el token');
        } else {
          resolve(token);
        }
      }
    );
  });
};

// Verificar JWT
const verificarJWT = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
      if (error) {
        reject('Token no válido');
      } else {
        resolve(payload);
      }
    });
  });
};

module.exports = {
  generarJWT,
  verificarJWT
};
