const Admin = require('../models/Admin');
const User = require('../models/User');
const { generarJWT } = require('../services/jwt');
const linkedinService = require('../services/linkedinService');

// Login de administrador
const loginAdmin = async (req, res) => {
  try {
    const { emailUsuario, contrasenia } = req.body;

    if (!emailUsuario || !contrasenia) {
      return res.status(400).json({
        ok: false,
        msj: 'Email y contraseña son obligatorios'
      });
    }

    const admin = await Admin.findOne({
      where: { email_usuario: emailUsuario, activo: true }
    });

    if (!admin) {
      return res.status(400).json({
        ok: false,
        msj: 'Credenciales no válidas'
      });
    }

    const contraseniaValida = await admin.verificarContrasenia(contrasenia);
    if (!contraseniaValida) {
      return res.status(400).json({
        ok: false,
        msj: 'Credenciales no válidas'
      });
    }

    const token = await generarJWT(admin.id, admin.nombre_usuario, admin.rol);

    res.json({
      ok: true,
      token,
      id: admin.id,
      nombreUsuario: admin.nombre_usuario,
      rol: admin.rol,
      msj: 'Login exitoso'
    });

  } catch (error) {
    console.error('Error en loginAdmin:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor'
    });
  }
};

// Renovar token
const renovarToken = async (req, res) => {
  try {
    const { id, nombreUsuario, rol } = req.usuario;
    const token = await generarJWT(id, nombreUsuario, rol);

    res.json({
      ok: true,
      token,
      id,
      nombreUsuario,
      rol
    });

  } catch (error) {
    console.error('Error en renovarToken:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor'
    });
  }
};

// Obtener URL de autorización de LinkedIn
const getLinkedInAuthUrl = async (req, res) => {
  try {
    const state = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const authUrl = linkedinService.generateAuthUrl(state);

      res.json({
        ok: true,
        authUrl,
        state
      });
    } catch (serviceError) {
      console.error('Error en linkedinService:', serviceError);
      return res.status(500).json({
        ok: false,
        msj: 'Configuración de LinkedIn incompleta. Verifica las variables de entorno.'
      });
    }

  } catch (error) {
    console.error('Error generando URL de LinkedIn:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor'
    });
  }
};

// Callback de LinkedIn - procesar código de autorización
const linkedinCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    console.log('LinkedIn callback recibido:', {
      hasCode: !!code,
      state,
      error,
      fullQuery: req.query
    });

    if (error) {
      console.error('Error de LinkedIn:', error);
      return res.status(400).json({
        ok: false,
        msj: `Error de LinkedIn: ${error}`
      });
    }

    if (!code) {
      return res.status(400).json({
        ok: false,
        msj: 'Código de autorización no recibido'
      });
    }

    try {
      // Intercambiar código por token
      const tokenData = await linkedinService.exchangeCodeForToken(code);
      console.log('Token intercambiado exitosamente');

      // Obtener perfil del usuario - intentar primero el método básico
      let linkedinData;
      try {
        linkedinData = await linkedinService.getUserProfile(tokenData.access_token);
        console.log('Perfil básico obtenido');

        // Intentar obtener datos adicionales
        try {
          const detailedProfile = await linkedinService.getDetailedProfile(tokenData.access_token);
          // Combinar datos básicos con detallados (básicos tienen prioridad)
          linkedinData = {
            ...detailedProfile,
            ...linkedinData, // Los datos básicos sobrescriben
          };
          console.log('Perfil detallado también obtenido');
        } catch (detailError) {
          console.log('No se pudieron obtener datos detallados, usando solo datos básicos');
        }
      } catch (profileError) {
        console.error('Error obteniendo perfil:', profileError);
        throw new Error('No se pudo obtener el perfil de LinkedIn');
      }

      if (!linkedinData.linkedin_id || !linkedinData.nombre || !linkedinData.correo) {
        console.error('Datos de LinkedIn incompletos:', linkedinData);
        throw new Error('Datos de perfil de LinkedIn incompletos');
      }

      console.log('Datos de LinkedIn obtenidos para:', linkedinData.nombre);

      // Buscar o crear usuario
      let user = await User.findOne({
        where: { linkedin_id: linkedinData.linkedin_id }
      });

      if (!user) {
        console.log('Creando nuevo usuario...');
        user = await User.create({
          ...linkedinData,
          linkedin_data: linkedinData,
          ultimo_acceso: new Date(),
          activo: true
        });
        console.log('Usuario creado con ID:', user.id);
      } else {
        console.log('Actualizando usuario existente...');
        await user.update({
          ...linkedinData,
          linkedin_data: linkedinData,
          ultimo_acceso: new Date()
        });
        console.log('Usuario actualizado');
      }

      // Generar JWT
      const token = await generarJWT(user.id, user.nombre, user.rol);

      res.json({
        ok: true,
        token,
        id: user.id,
        nombreUsuario: user.nombre,
        rol: user.rol,
        msj: 'Login con LinkedIn exitoso'
      });

    } catch (linkedinError) {
      console.error('Error procesando LinkedIn:', linkedinError);
      res.status(500).json({
        ok: false,
        msj: linkedinError.message || 'Error procesando autenticación de LinkedIn'
      });
    }

  } catch (error) {
    console.error('Error en linkedinCallback:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor'
    });
  }
};

// Login directo con LinkedIn (para datos simulados en desarrollo)
const loginLinkedIn = async (req, res) => {
  try {
    const { linkedinData } = req.body;

    if (!linkedinData) {
      return res.status(400).json({
        ok: false,
        msj: 'Datos de LinkedIn requeridos'
      });
    }

    const {
      linkedin_id,
      nombre,
      correo,
      perfil_imagen_url,
      posicion_actual,
      empresa_actual,
      ubicacion,
      resumen,
      industria
    } = linkedinData;

    if (!linkedin_id || !nombre || !correo) {
      return res.status(400).json({
        ok: false,
        msj: 'Datos de LinkedIn incompletos'
      });
    }

    // Buscar o crear usuario
    let user = await User.findOne({
      where: { linkedin_id }
    });

    if (!user) {
      user = await User.create({
        linkedin_id,
        nombre,
        correo,
        linkedin_data: linkedinData,
        perfil_imagen_url,
        posicion_actual,
        empresa_actual,
        ubicacion,
        resumen,
        industria,
        ultimo_acceso: new Date(),
        activo: true
      });
      console.log('Usuario simulado creado con ID:', user.id);
    } else {
      await user.update({
        nombre,
        correo,
        linkedin_data: linkedinData,
        perfil_imagen_url,
        posicion_actual,
        empresa_actual,
        ubicacion,
        resumen,
        industria,
        ultimo_acceso: new Date()
      });
      console.log('Usuario simulado actualizado');
    }

    const token = await generarJWT(user.id, user.nombre, user.rol);

    res.json({
      ok: true,
      token,
      id: user.id,
      nombreUsuario: user.nombre,
      rol: user.rol,
      msj: 'Login con LinkedIn exitoso'
    });

  } catch (error) {
    console.error('Error en loginLinkedIn:', error);
    res.status(500).json({
      ok: false,
      msj: 'Error del servidor'
    });
  }
};

module.exports = {
  loginAdmin,
  renovarToken,
  getLinkedInAuthUrl,
  linkedinCallback,
  loginLinkedIn
};
