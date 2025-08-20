const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./src/config/database');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const dashboardRoutes = require('./src/routes/dashboard');
const adminRoutes = require('./src/routes/admins');

const app = express();

// Conectar a la base de datos
connectDB();

// CORS mejorado - ya maneja OPTIONS automáticamente
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://127.0.0.1:4200'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-token']
}));

// NO necesitas esta línea - CORS ya maneja OPTIONS
// app.options('*', cors()); // <-- Esta línea causaba el error

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admins', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: 'MySQL conectado'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({
    ok: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`phpMyAdmin: http://localhost/phpmyadmin`);
});
