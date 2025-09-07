const User = require('../models/User');
const Admin = require('../models/Admin');
const Encuesta = require('../models/Encuesta');
const Pregunta = require('../models/Pregunta');
const Respuesta = require('../models/Respuesta');
const SesionEncuesta = require('../models/SesionEncuesta');
const Notificacion = require('../models/Notificacion');

// Asociaciones de Encuestas
Encuesta.belongsTo(Admin, { 
  foreignKey: 'admin_creador_id', 
  as: 'creador' 
});

Admin.hasMany(Encuesta, { 
  foreignKey: 'admin_creador_id', 
  as: 'encuestas_creadas' 
});

// Asociaciones de Preguntas
Encuesta.hasMany(Pregunta, { 
  foreignKey: 'encuesta_id', 
  as: 'preguntas' 
});

Pregunta.belongsTo(Encuesta, { 
  foreignKey: 'encuesta_id', 
  as: 'encuesta' 
});

// Asociaciones de Respuestas
Pregunta.hasMany(Respuesta, { 
  foreignKey: 'pregunta_id', 
  as: 'respuestas' 
});

Respuesta.belongsTo(Pregunta, { 
  foreignKey: 'pregunta_id', 
  as: 'pregunta' 
});

Respuesta.belongsTo(User, { 
  foreignKey: 'usuario_id', 
  as: 'usuario' 
});

User.hasMany(Respuesta, { 
  foreignKey: 'usuario_id', 
  as: 'respuestas' 
});

Respuesta.belongsTo(Encuesta, { 
  foreignKey: 'encuesta_id', 
  as: 'encuesta' 
});

Encuesta.hasMany(Respuesta, { 
  foreignKey: 'encuesta_id', 
  as: 'respuestas' 
});

// Asociaciones de Sesiones
Encuesta.hasMany(SesionEncuesta, { 
  foreignKey: 'encuesta_id', 
  as: 'sesiones' 
});

SesionEncuesta.belongsTo(Encuesta, { 
  foreignKey: 'encuesta_id', 
  as: 'encuesta' 
});

SesionEncuesta.belongsTo(User, { 
  foreignKey: 'usuario_id', 
  as: 'usuario' 
});

User.hasMany(SesionEncuesta, { 
  foreignKey: 'usuario_id', 
  as: 'sesiones' 
});

// Asociaciones de Notificaciones
User.hasMany(Notificacion, { 
  foreignKey: 'usuario_id', 
  as: 'notificaciones' 
});

Notificacion.belongsTo(User, { 
  foreignKey: 'usuario_id', 
  as: 'usuario' 
});

Notificacion.belongsTo(Encuesta, { 
  foreignKey: 'encuesta_id', 
  as: 'encuesta' 
});

Encuesta.hasMany(Notificacion, { 
  foreignKey: 'encuesta_id', 
  as: 'notificaciones' 
});

module.exports = {
  User,
  Admin,
  Encuesta,
  Pregunta,
  Respuesta,
  SesionEncuesta,
  Notificacion
};

