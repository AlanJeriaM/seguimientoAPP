require("dotenv").config();

const { connectDB } = require("./src/config/database");
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log("phpMyAdmin: http://localhost/phpmyadmin");
  });
};

startServer();
