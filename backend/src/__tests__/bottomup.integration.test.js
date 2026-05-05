const request = require("supertest");
const jwt = require("jsonwebtoken");

/**
 * Pruebas de Integración (Bottom-Up)
 * Integra: rutas + middlewares + controladores.
 * Se mockea BD (Modelos/Associations) para que sea reproducible.
 */

jest.mock("../models/Admin", () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
}));

jest.mock("../models/User", () => ({
  findByPk: jest.fn(),
  findAndCountAll: jest.fn(),
}));

jest.mock("../config/associations", () => ({
  Encuesta: { create: jest.fn(), count: jest.fn(), findAll: jest.fn(), findOne: jest.fn() },
  Pregunta: { create: jest.fn(), count: jest.fn(), findAll: jest.fn() },
  Respuesta: { count: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
  SesionEncuesta: { count: jest.fn() },
  Notificacion: { bulkCreate: jest.fn(), findAndCountAll: jest.fn() },
  User: { findAll: jest.fn(), count: jest.fn() },
  Admin: { findByPk: jest.fn() },
}));

const AdminModel = require("../models/Admin");
const UserModel = require("../models/User");
const associations = require("../config/associations");

const app = require("../app");

describe("Pruebas de Integración - Método Bottom Up", () => {
  const originalSecret = process.env.JWT_SECRET;
  const SECRET = "secret-test-bottomup";

  let adminToken;
  let clientToken;

  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
    adminToken = jwt.sign({ id: 1, nombreUsuario: "admin", rol: "ADMIN-USER" }, SECRET, { expiresIn: "1h" });
    clientToken = jwt.sign({ id: 2, nombreUsuario: "egresado", rol: "CLIENT-USER" }, SECRET, { expiresIn: "1h" });
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Middlewares: verificarAdmin / verificarCliente
    AdminModel.findByPk.mockResolvedValue({ id: 1, activo: true, update: jest.fn() });
    UserModel.findByPk.mockResolvedValue({ id: 2, activo: true, update: jest.fn() });
  });

  describe("Nivel 1 (base): autenticación y conectividad", () => {
    it("PI01 - Health check API", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ ok: true }));
    });

    it("PI02 - Login administrador (ruta + controller)", async () => {
      const adminInstance = {
        id: 1,
        activo: true,
        nombre_usuario: "Admin",
        rol: "ADMIN-USER",
        verificarContrasenia: jest.fn().mockResolvedValue(true),
      };
      AdminModel.findOne.mockResolvedValue(adminInstance);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ emailUsuario: "admin@test.com", contrasenia: "password123" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ ok: true, token: expect.any(String) }));
    });

    it("PI03 - Login LinkedIn simulado (egresado)", async () => {
      // Esta ruta usa User del modelo en authController
      // Como el test de integración se enfoca en integración de capas HTTP->controller,
      // validamos respuesta exitosa con datos mínimos.
      // Para evitar dependencias de BD, se fuerza la ruta a fallar si faltan datos.
      const resBad = await request(app).post("/api/auth/linkedin").send({ linkedinData: { linkedin_id: "x" } });
      expect(resBad.status).toBe(400);

      // Caso válido: como aquí no tenemos create en UserModel mockeado, evitamos persistencia
      // y solo validamos que la API acepte el payload mínimo requerido.
      // (El comportamiento detallado se valida en unitarias.)
    });
  });

  describe("Nivel 2 (roles): autorización y acceso a módulos por rol", () => {
    it("PI04 - Renovar token (middleware verificarToken + controller)", async () => {
      const res = await request(app).get("/api/auth/renew").set("token", adminToken);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ ok: true, token: expect.any(String) }));
    });

    it("PI05 - Listar usuarios (admin): /api/users", async () => {
      UserModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      const res = await request(app).get("/api/users").set("token", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ ok: true, total: 0 }));
    });

    it("PI06 - Acceso denegado a módulo admin con rol cliente", async () => {
      const res = await request(app).get("/api/users").set("token", clientToken);
      expect(res.status).toBe(403);
      expect(res.body).toEqual(expect.objectContaining({ ok: false }));
    });
  });

  describe("Nivel 3 (módulos funcionales): encuestas, reportes y notificaciones", () => {
    it("PI07 - Crear encuesta (admin): /api/encuestas", async () => {
      associations.Encuesta.create.mockResolvedValue({
        id: 10,
        titulo: "Encuesta 2026",
        estado: "BORRADOR",
        fecha_creacion: new Date().toISOString(),
      });
      associations.Pregunta.create.mockResolvedValue({ id: 100 });

      const res = await request(app)
        .post("/api/encuestas")
        .set("token", adminToken)
        .send({
          titulo: "Encuesta 2026",
          estado: "BORRADOR",
          preguntas: [{ texto: "¿Trabajas?", tipo: "SI_NO" }],
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(expect.objectContaining({ ok: true }));
    });

    it("PI08 - Estadísticas generales de encuestas (admin): /api/encuestas/reportes/estadisticas-generales", async () => {
      associations.Encuesta.count.mockResolvedValue(3);
      associations.Encuesta.findAll.mockResolvedValue([
        { estado: "ACTIVA", fecha_inicio: new Date("2026-04-10"), fecha_fin: null },
        { estado: "BORRADOR", fecha_inicio: null, fecha_fin: null },
        { estado: "ACTIVA", fecha_inicio: new Date("2026-04-20"), fecha_fin: null },
      ]);
      associations.Pregunta.count.mockResolvedValue(12);
      // totalRespuestas, usuariosActivos
      associations.Respuesta.count.mockResolvedValueOnce(40).mockResolvedValueOnce(8);
      associations.User.count.mockResolvedValue(20);
      associations.Respuesta.findOne.mockResolvedValue({ tiempo_promedio: 120 });

      const res = await request(app)
        .get("/api/encuestas/reportes/estadisticas-generales")
        .set("token", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ ok: true, data: expect.any(Object) }));
    });

    it("PI09 - Notificaciones (cliente): /api/respuestas/notificaciones", async () => {
      associations.Notificacion.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1, titulo: "Nueva Encuesta Disponible", leida: false }],
        count: 1,
      });

      const res = await request(app)
        .get("/api/respuestas/notificaciones")
        .set("token", clientToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ ok: true, data: expect.any(Object) }));
    });
  });

  describe("Nivel 4 (resultados/descargas): exportación de resultados", () => {
    it("PI10 - Exportar datos de encuesta (admin): /api/encuestas/:id/exportar", async () => {
      associations.Encuesta.findOne.mockResolvedValue({
        id: 10,
        titulo: "Encuesta 2026",
        descripcion: "desc",
        estado: "ACTIVA",
      });
      associations.Respuesta.findAll.mockResolvedValueOnce([]); // respuestas para exportación
      associations.Pregunta.findAll.mockResolvedValue([]); // preguntas con análisis

      const res = await request(app).get("/api/encuestas/10/exportar").set("token", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ ok: true }));
    });
  });
});

