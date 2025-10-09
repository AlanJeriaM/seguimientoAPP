const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configuración del transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER || 'tu-email@gmail.com',
        pass: process.env.SMTP_PASS || 'tu-password-app'
      }
    });

    // Configuración alternativa para Gmail (usando OAuth2)
    if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: process.env.GMAIL_ACCESS_TOKEN
        }
      });
    }
  }

  // Plantilla HTML para el código de restablecimiento
  generateResetCodeTemplate(adminName, resetCode, expirationTime) {
    const currentYear = new Date().getFullYear();

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Restablecimiento</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
            }

            .container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }

            .header {
                background-color: #2563eb;
                color: white;
                padding: 24px;
                text-align: center;
            }

            .header h1 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            }

            .content {
                padding: 24px;
            }

            .greeting {
                margin-bottom: 16px;
                font-weight: 500;
            }

            .message {
                margin-bottom: 24px;
                color: #666;
            }

            .code-box {
                background-color: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 5px;
                padding: 20px;
                text-align: center;
                margin: 24px 0;
            }

            .code {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                letter-spacing: 3px;
                font-family: monospace;
            }

            .expiration {
                font-size: 12px;
                color: #dc2626;
                margin-top: 8px;
            }

            .warning {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 16px;
                margin: 20px 0;
                font-size: 14px;
            }

            .footer {
                background-color: #f8f9fa;
                padding: 16px 24px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #e9ecef;
            }

            @media (max-width: 600px) {
                body { padding: 10px; }
                .container { margin: 0; }
                .header, .content { padding: 20px; }
                .code { font-size: 20px; letter-spacing: 2px; }
                .footer { padding: 12px 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Código de Restablecimiento</h1>
            </div>

            <div class="content">
                <div class="greeting">
                    Hola <strong>${adminName}</strong>:
                </div>

                <div class="message">
                    Has solicitado restablecer tu contraseña.
                    Utiliza el siguiente código para continuar:
                </div>

                <div class="code-box">
                    <div class="code">${resetCode}</div>
                    <div class="expiration">Expira: ${expirationTime}</div>
                </div>

                <div class="warning">
                    <strong>Importante:</strong> Este código es válido por 10 minutos y es de un solo uso.
                </div>
            </div>

            <div class="footer">
                Sistema de Seguimiento de Egresados © ${currentYear}
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Plantilla HTML para confirmación de cambio de contraseña
  generatePasswordChangedTemplate(adminName, changeTime) {
    const currentYear = new Date().getFullYear();

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Actualizada</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
            }

            .container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }

            .header {
                background-color: #16a34a;
                color: white;
                padding: 24px;
                text-align: center;
            }

            .header h1 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            }

            .content {
                padding: 24px;
            }

            .greeting {
                margin-bottom: 16px;
                font-weight: 500;
            }

            .message {
                margin-bottom: 24px;
                color: #666;
            }

            .success-box {
                background-color: #f0fdf4;
                border: 2px solid #bbf7d0;
                border-radius: 5px;
                padding: 20px;
                text-align: center;
                margin: 24px 0;
            }

            .success-title {
                font-size: 16px;
                font-weight: 600;
                color: #16a34a;
                margin-bottom: 8px;
            }

            .change-time {
                font-size: 14px;
                color: #374151;
                background-color: white;
                padding: 8px 12px;
                border-radius: 5px;
                display: inline-block;
            }

            .info {
                background-color: #f1f5f9;
                border-left: 4px solid #3b82f6;
                padding: 16px;
                margin: 20px 0;
                font-size: 14px;
            }

            .footer {
                background-color: #f8f9fa;
                padding: 16px 24px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #e9ecef;
            }

            @media (max-width: 600px) {
                body { padding: 10px; }
                .container { margin: 0; }
                .header, .content { padding: 20px; }
                .footer { padding: 12px 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Contraseña Actualizada</h1>
            </div>

            <div class="content">
                <div class="greeting">
                    Hola <strong>${adminName}</strong>:
                </div>

                <div class="message">
                    Tu contraseña ha sido actualizada exitosamente.
                    Ya puedes acceder al sistema con tu nueva contraseña.
                </div>

                <div class="success-box">
                    <div class="success-title">Cambio Exitoso</div>
                    <div class="change-time">${changeTime}</div>
                </div>

                <div class="info">
                    <strong>Nota:</strong> Se han cerrado todas las sesiones activas en otros dispositivos por seguridad.
                </div>
            </div>

            <div class="footer">
                Sistema de Seguimiento de Egresados © ${currentYear}
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Enviar código de restablecimiento
  async sendResetCode(email, adminName, resetCode, expirationTime) {
    try {
      const htmlContent = this.generateResetCodeTemplate(adminName, resetCode, expirationTime);

      const mailOptions = {
        from: `"Sistema de Seguimiento" <${process.env.SMTP_USER || 'noreply@sistema.com'}>`,
        to: email,
        subject: 'Código de Restablecimiento - Sistema de Seguimiento',
        html: htmlContent,
        text: `
          Código de Restablecimiento: ${resetCode}

          Hola ${adminName},

          Has solicitado restablecer tu contraseña de administrador.
          Tu código de verificación es: ${resetCode}

          Este código expira en: ${expirationTime}

          Si no solicitaste este cambio, ignora este email.

          Saludos,
          Sistema de Seguimiento de Egresados
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado exitosamente:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('Error al enviar email:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar confirmación de cambio de contraseña
  async sendPasswordChangedConfirmation(email, adminName) {
    try {
      const changeTime = new Date().toLocaleString('es-ES', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const htmlContent = this.generatePasswordChangedTemplate(adminName, changeTime);

      const mailOptions = {
        from: `"Sistema de Seguimiento" <${process.env.SMTP_USER || 'noreply@sistema.com'}>`,
        to: email,
        subject: 'Contraseña Actualizada - Sistema de Seguimiento',
        html: htmlContent,
        text: `
          Hola ${adminName},

          Tu contraseña de administrador ha sido cambiada exitosamente.
          Cambio realizado: ${changeTime}

          Ya puedes acceder al sistema con tu nueva contraseña.

          Saludos,
          Sistema de Seguimiento de Egresados
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de confirmación enviado:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('Error al enviar email de confirmación:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar configuración del email
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Servidor de email configurado correctamente');
      return true;
    } catch (error) {
      console.error('Error en configuración de email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
