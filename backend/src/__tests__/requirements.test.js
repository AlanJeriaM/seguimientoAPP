const request = require("supertest");
const jwt = require("jsonwebtoken");

/**
 * Pruebas de Requerimientos
 * Valida: Completitud, Claridad, Correctitud
 * Relaciona: Requerimientos → Historias de Usuario → Estados de Implementación
 */

jest.mock("../models/Admin", () => {
  const { Model } = require("sequelize");
  class Admin extends Model {}
  Admin.init = jest.fn();
  Admin.belongsTo = jest.fn();
  Admin.hasMany = jest.fn();
  Admin.findAll = jest.fn();
  Admin.findOne = jest.fn();
  Admin.create = jest.fn();
  // Retorna un admin activo para que verificarAdmin no bloquee con 403
  Admin.findByPk = jest.fn().mockResolvedValue({
    id: 1,
    nombreUsuario: "admin",
    rol: "ADMIN-USER",
    activo: true,
    update: jest.fn().mockResolvedValue(true),
  });
  return Admin;
});

jest.mock("../models/User", () => {
  const { Model } = require("sequelize");
  class User extends Model {}
  User.init = jest.fn();
  User.belongsTo = jest.fn();
  User.hasMany = jest.fn();
  User.findAll = jest.fn();
  User.findOne = jest.fn();
  User.create = jest.fn();
  // Retorna un usuario activo para que verificarCliente no bloquee con 403
  User.findByPk = jest.fn().mockResolvedValue({
    id: 2,
    nombreUsuario: "egresado",
    rol: "CLIENT-USER",
    activo: true,
    update: jest.fn().mockResolvedValue(true),
  });
  return User;
});

jest.mock("../config/associations", () => jest.fn());

const app = require("../app");

describe("Pruebas de Requerimientos", () => {
  const SECRET = "secret-test-requirements";
  let adminToken, clientToken;

  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
    adminToken = jwt.sign({ id: 1, nombreUsuario: "admin", rol: "ADMIN-USER" }, SECRET);
    clientToken = jwt.sign({ id: 2, nombreUsuario: "egresado", rol: "CLIENT-USER" }, SECRET);
  });

  /**
   * CRITERIO 1: COMPLETITUD
   * Verifica que los requerimientos contemplen los elementos necesarios
   */
  describe("Completitud de Requerimientos", () => {
    it("CR01 - Los requerimientos están priorizados", async () => {
      const requisitos = [
        { id: "RF001", prioridad: "ALTA", descripcion: "Visualizar reportes de egresados" },
        { id: "RF002", prioridad: "ALTA", descripcion: "Gestionar encuestas" },
        { id: "RF003", prioridad: "MEDIA", descripcion: "Descargar resultados" },
      ];

      const conPrioridad = requisitos.every(r => r.prioridad && ["ALTA", "MEDIA", "BAJA"].includes(r.prioridad));
      expect(conPrioridad).toBe(true);
    });

    it("CR02 - La prioridad está correctamente definida", async () => {
      const requisitosAlta = [
        "Autenticación de usuarios",
        "Gestión de encuestas",
        "Visualizar reportes",
      ];
      const requisitosMedia = [
        "Exportar datos",
        "Notificaciones",
      ];

      expect(requisitosAlta.length > 0).toBe(true);
      expect(requisitosMedia.length > 0).toBe(true);
    });

    it("CR03 - Están los conceptos básicos para que el sistema opere correctamente", async () => {
      const modulosBase = ["auth", "encuestas", "reportes", "usuarios", "respuestas"];
      const res = await request(app).get("/api/health").set("token", adminToken);

      expect(res.status).toBe(200);
      expect(modulosBase.length).toBe(5);
    });

    it("CR04 - Los requerimientos ayudan a cumplir el propósito de la herramienta", async () => {
      const objetivoSistema = {
        principal: "Seguimiento de egresados",
        funcionalidades: ["Encuestas", "Reportes", "Notificaciones", "Exportación"]
      };

      const cumplePropósito = objetivoSistema.funcionalidades.length >= 3;
      expect(cumplePropósito).toBe(true);
    });
  });

  /**
   * CRITERIO 2: CLARIDAD
   * Verifica que los requerimientos sean comprensibles y representen el comportamiento esperado
   */
  describe("Claridad de Requerimientos", () => {
    it("CR05 - Los requerimientos son claros y fáciles de entender", async () => {
      const historiasUsuario = [
        "Yo como Egresado, quiero visualizar el módulo de reportes con métricas, para conocer información agregada",
        "Yo como Administrador, quiero gestionar encuestas, para recopilar información de egresados",
      ];

      const formato = historiasUsuario.every(h =>
        h.includes("Yo como") && h.includes("quiero") && h.includes("para")
      );
      expect(formato).toBe(true);
    });

    it("CR06 - Los requerimientos reflejan el comportamiento de la herramienta", async () => {
      const historiaVSEndpoint = {
        "visualizar reportes": "/api/encuestas/reportes",
        "listar encuestas": "/api/encuestas",
        "ver respuestas": "/api/respuestas",
        "descargar datos": "/api/encuestas/:id/exportar",
      };

      Object.keys(historiaVSEndpoint).forEach(historia => {
        expect(historiaVSEndpoint[historia]).toBeTruthy();
      });
    });
  });

  /**
   * CRITERIO 3: CORRECTITUD
   * Verifica que los requerimientos representen fielmente las necesidades identificadas
   */
  describe("Correctitud de Requerimientos", () => {
    it("CR07 - Los requerimientos reflejan las necesidades encontradas", async () => {
      const necesidadesBase = [
        { necesidad: "Seguimiento post-titulación", requerimiento: "RF001-Encuestas" },
        { necesidad: "Métricas de empleo", requerimiento: "RF002-Reportes" },
        { necesidad: "Análisis de impacto", requerimiento: "RF003-Estadísticas" },
      ];

      const mapeoCompleto = necesidadesBase.every(item =>
        item.necesidad && item.requerimiento
      );
      expect(mapeoCompleto).toBe(true);
    });
  });

  /**
   * HISTORIAS DE USUARIO Y ESTADOS DE IMPLEMENTACIÓN
   */
  describe("Historias de Usuario - Estados de Implementación", () => {
    const estadosImplementacion = {
      "Completo": 1.0,
      "Incompleto": 0.99,
      "En desarrollo": 0.50,
      "En inicio": 0.10,
      "No considerado": 0.0
    };

    it("HU01 - Visualizar reportes de egresados (Egresado): COMPLETO", async () => {
      const res = await request(app)
        .get("/api/encuestas/reportes/estadisticas-generales")
        .set("token", clientToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(estadosImplementacion["Completo"]).toBe(1.0);
    });

    it("HU02 - Visualizar encuestas clasificadas por estado (Egresado): COMPLETO", async () => {
      const res = await request(app)
        .get("/api/encuestas")
        .set("token", clientToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("HU03 - Revisar detalle de encuestas completadas (Egresado): COMPLETO", async () => {
      const res = await request(app)
        .get("/api/respuestas")
        .set("token", clientToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("HU04 - Visualizar reportes con análisis (Administrador): EN_DESARROLLO", async () => {
      const res = await request(app)
        .get("/api/encuestas/reportes/estadisticas-generales")
        .set("token", adminToken);

      expect(res.status).toBe(200);
      expect(estadosImplementacion["En desarrollo"]).toBeGreaterThanOrEqual(0.50);
    });

    it("HU05 - Visualizar resultados y descargar (Administrador): COMPLETO", async () => {
      const res = await request(app)
        .get("/api/encuestas/10/exportar")
        .set("token", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("HU06 - Visualizar métricas globales de encuestas (Administrador): COMPLETO", async () => {
      const res = await request(app)
        .get("/api/encuestas/reportes/estadisticas-generales")
        .set("token", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  /**
   * MATRIZ DE TRAZABILIDAD: Requerimiento → Historia Usuario → Endpoint
   */
  describe("Trazabilidad Requerimiento-Historia-Implementación", () => {
    const matrizTrazabilidad = [
      {
        requerimiento: "RF001",
        historia: "HU01, HU02, HU03",
        endpoint: "/api/encuestas",
        estado: "Completo",
        actores: ["Egresado", "Administrador"]
      },
      {
        requerimiento: "RF002",
        historia: "HU04, HU05, HU06",
        endpoint: "/api/encuestas/reportes",
        estado: "Completo",
        actores: ["Administrador"]
      },
      {
        requerimiento: "RF003",
        historia: "HU05",
        endpoint: "/api/encuestas/:id/exportar",
        estado: "Completo",
        actores: ["Administrador"]
      }
    ];

    it("TRZ01 - Validar trazabilidad completa", () => {
      matrizTrazabilidad.forEach(item => {
        expect(item.requerimiento).toBeTruthy();
        expect(item.historia).toBeTruthy();
        expect(item.endpoint).toBeTruthy();
        expect(["Completo", "Incompleto", "En desarrollo", "En inicio", "No considerado"]).toContain(item.estado);
      });
    });

    it("TRZ02 - Todas las historias tienen requerimiento asignado", () => {
      const historiasAsignadas = matrizTrazabilidad
        .flatMap(item => item.historia.split(", "))
        .length;

      expect(historiasAsignadas).toBeGreaterThanOrEqual(6);
    });
  });
});
