const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admins");
const encuestaRoutes = require("./routes/encuestas");
const respuestaRoutes = require("./routes/respuestas");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:4200", "http://127.0.0.1:4200"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token", "x-token"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/encuestas", encuestaRoutes);
app.use("/api/respuestas", respuestaRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
    database: "MySQL conectado",
  });
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
  });
});

app.use((error, req, res, next) => {
  console.error("Error global:", error);
  res.status(500).json({
    ok: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? error.message : "Error interno",
  });
});

module.exports = app;
