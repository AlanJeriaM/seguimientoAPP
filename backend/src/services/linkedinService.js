const axios = require('axios');

class LinkedInService {
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    console.log('LinkedIn Config:', {
      clientId: this.clientId ? `${this.clientId.substring(0, 8)}...` : 'MISSING',
      redirectUri: this.redirectUri,
      hasSecret: !!this.clientSecret
    });

    // Validar configuración
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.error('ERROR: Configuración de LinkedIn incompleta');
      console.error('Verifica que estas variables estén en tu .env:');
      console.error('LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI');
    }
  }

  // Generar URL de autorización de LinkedIn
  generateAuthUrl(state = 'random_state') {
    try {
      if (!this.clientId || !this.redirectUri) {
        throw new Error('Configuración de LinkedIn incompleta');
      }

      const scope = 'openid profile email';
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: scope,
        state: state
      });

      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
      console.log('Generated Auth URL:', authUrl);
      return authUrl;
    } catch (error) {
      console.error('Error generando URL de autorización:', error);
      throw error;
    }
  }

  // Intercambiar código por token de acceso
  async exchangeCodeForToken(code) {
    try {
      console.log('Intercambiando código por token...');

      if (!this.clientId || !this.clientSecret || !this.redirectUri) {
        throw new Error('Configuración de LinkedIn incompleta');
      }

      const data = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      });

      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('Token obtenido exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error intercambiando código por token:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      if (error.response?.status === 400) {
        throw new Error('Código de autorización inválido o expirado');
      } else if (error.response?.status === 401) {
        throw new Error('Credenciales de LinkedIn inválidas');
      } else {
        throw new Error('Error al obtener token de LinkedIn');
      }
    }
  }

  // Obtener información básica del perfil (OpenID Connect)
  async getUserProfile(accessToken) {
    try {
      console.log('Obteniendo perfil básico...');

      const [profileResponse, emailResponse] = await Promise.all([
        axios.get('https://api.linkedin.com/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }),
        axios.get('https://api.linkedin.com/v2/emailAddresses?q=members&projection=(elements*(handle~))', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }).catch(err => {
          console.log('No se pudo obtener email adicional, usando email del perfil');
          return null;
        })
      ]);

      const profile = profileResponse.data;
      let email = profile.email;

      // Si no viene email en el perfil, intentar obtenerlo de la API de emails
      if (!email && emailResponse?.data?.elements?.length > 0) {
        email = emailResponse.data.elements[0]['handle~']?.emailAddress;
      }

      // Formatear datos del perfil
      const userData = {
        linkedin_id: profile.sub, // En OpenID Connect, 'sub' es el ID único
        nombre: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
        correo: email,
        perfil_imagen_url: profile.picture || null
      };

      console.log('Perfil básico obtenido:', userData.nombre);
      return userData;
    } catch (error) {
      console.error('Error obteniendo perfil básico:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error('No se pudo obtener el perfil del usuario');
    }
  }

  // Obtener información detallada del perfil (API v2)
  async getDetailedProfile(accessToken) {
    try {
      console.log('Obteniendo perfil detallado...');

      const response = await axios.get(
        'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,headline,summary,industry,location,positions,profilePicture(displayImage~:playableStreams))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      const profile = response.data;
      const currentPosition = profile.positions?.values?.[0];

      const detailedData = {
        linkedin_id: profile.id,
        nombre: this.formatName(profile.firstName, profile.lastName),
        perfil_imagen_url: this.extractImageUrl(profile.profilePicture) || null,
        posicion_actual: profile.headline?.localized?.es_ES || profile.headline?.localized?.en_US || currentPosition?.title || null,
        empresa_actual: currentPosition?.company?.name || null,
        ubicacion: profile.location?.name || null,
        resumen: profile.summary?.localized?.es_ES || profile.summary?.localized?.en_US || null,
        industria: profile.industry || null
      };

      console.log('Perfil detallado obtenido:', detailedData.nombre);
      return detailedData;
    } catch (error) {
      console.error('Error obteniendo perfil detallado:', {
        status: error.response?.status,
        message: error.message
      });

      // Si falla el perfil detallado, retornamos datos vacíos
      return {
        linkedin_id: null,
        nombre: null,
        perfil_imagen_url: null,
        posicion_actual: null,
        empresa_actual: null,
        ubicacion: null,
        resumen: null,
        industria: null
      };
    }
  }

  // Función auxiliar para formatear nombres
  formatName(firstName, lastName) {
    if (!firstName && !lastName) return null;

    const first = firstName?.localized?.es_ES || firstName?.localized?.en_US || '';
    const last = lastName?.localized?.es_ES || lastName?.localized?.en_US || '';

    return `${first} ${last}`.trim();
  }

  // Función auxiliar para extraer URL de imagen
  extractImageUrl(profilePicture) {
    try {
      if (!profilePicture) return null;
      
      // Buscar la URL de imagen en la estructura de LinkedIn
      let imageUrl = profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier;
      
      // Validar que la URL sea válida
      if (imageUrl && this.isValidImageUrl(imageUrl)) {
        console.log('✅ URL de imagen válida:', imageUrl);
        return imageUrl;
      }
      
      console.log('⚠️ URL de imagen inválida o no encontrada');
      return null;
    } catch (error) {
      console.error('Error extrayendo URL de imagen:', error);
      return null;
    }
  }

  // Validar URL de imagen
  isValidImageUrl(url) {
    try {
      const validUrl = new URL(url);
      // Verificar que sea http/https y tenga un dominio válido
      return ['http:', 'https:'].includes(validUrl.protocol) && 
             validUrl.hostname.length > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new LinkedInService();
