const { sequelize } = require('./src/config/database');
const Admin = require('./src/models/Admin');
const User = require('./src/models/User');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Conectando a MySQL...');
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida');

    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync({ alter: true }); // Cambiado de force a alter
    console.log('✅ Tablas creadas/actualizadas');

    // Crear admin por defecto
    const adminExistente = await Admin.findOne({
      where: { email_usuario: 'admin@admin.com' }
    });

    if (!adminExistente) {
      await Admin.create({
        email_usuario: 'admin@admin.com',
        contrasenia: 'admin123',
        nombre_usuario: 'Super Admin',
        rol: 'ADMIN-USER'
      });
      console.log('✅ Admin creado: admin@admin.com / admin123');
    } else {
      console.log('ℹ️  Admin ya existe');
    }

    // Crear usuario de prueba
    const userExistente = await User.findOne({
      where: { linkedin_id: 'test-user-123' }
    });

    if (!userExistente) {
      await User.create({
        linkedin_id: 'test-user-123',
        nombre: 'Usuario Prueba',
        correo: 'usuario@prueba.com',
        posicion_actual: 'Developer',
        empresa_actual: 'Tech Company',
        ubicacion: 'Santiago, Chile',
        industria: 'Tecnología'
      });
      console.log('✅ Usuario de prueba creado');
    } else {
      console.log('ℹ️  Usuario de prueba ya existe');
    }

    console.log('🎉 Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

initializeDatabase();
