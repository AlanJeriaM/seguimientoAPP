const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // Desactiva los logs de SQL (ponlo en true si quieres ver las consultas)
    define: {
      timestamps: true, // Añade automáticamente createdAt y updatedAt
      underscored: true, // Usa snake_case en lugar de camelCase para los nombres de columnas
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Función para probar la conexión
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente');

    // Sincronizar modelos (crear tablas si no existen)
    // Cambiado a false para evitar crear índices duplicados
    await sequelize.sync({ alter: false }); // solo crea tablas que no existen
    console.log('Modelos sincronizados con la base de datos');
    
    // Importar asociaciones después de la sincronización
    require('./associations');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB
};
