jest.mock("../../models/Admin", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../services/jwt", () => ({
  generarJWT: jest.fn(),
}));

jest.mock("../../services/linkedinService", () => ({
  generateAuthUrl: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  getUserProfile: jest.fn(),
  getDetailedProfile: jest.fn(),
}));

jest.mock("../../services/emailService", () => ({
  sendResetCode: jest.fn(),
  sendPasswordChangedConfirmation: jest.fn(),
}));

jest.mock("../../config/associations", () => ({
  Encuesta: { create: jest.fn(), findOne: jest.fn(), count: jest.fn(), findAll: jest.fn() },
  Pregunta: { create: jest.fn(), count: jest.fn(), findAll: jest.fn() },
  Respuesta: { count: jest.fn(), findAll: jest.fn(), findOne: jest.fn() },
  SesionEncuesta: { count: jest.fn() },
  Notificacion: { bulkCreate: jest.fn(), count: jest.fn(), findAndCountAll: jest.fn(), findOne: jest.fn(), update: jest.fn() },
  User: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), count: jest.fn(), create: jest.fn() },
  Admin: { findByPk: jest.fn() },
}));

jest.mock("../../models/User", () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
}));

const AdminModel = require("../../models/Admin");
const UserModel = require("../../models/User");
const { generarJWT } = require("../../services/jwt");
const emailService = require("../../services/emailService");
const linkedinService = require("../../services/linkedinService");
const associations = require("../../config/associations");
const jwt = require("jsonwebtoken");

const {
  loginAdmin,
  enviarCodigoRestablecimiento,
  loginLinkedIn,
} = require("../authController");
const { crearEncuesta } = require("../encuestaController");
const { actualizarUsuario } = require("../userController");
const { obtenerNotificaciones } = require("../respuestaController");
const {
  obtenerEstadisticasGenerales,
  exportarDatosEncuesta,
} = require("../reporteController");
const { verificarToken } = require("../../middleware/auth");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("PU02 - Login Administrador", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe permitir login con credenciales validas", async () => {
    const req = {
      body: {
        emailUsuario: "admin@test.com",
        contrasenia: "password123",
      },
    };
    const res = buildRes();

    const adminMock = {
      id: 1,
      nombre_usuario: "admin",
      rol: "ADMIN-USER",
      verificarContrasenia: jest.fn().mockResolvedValue(true),
    };

    AdminModel.findOne.mockResolvedValue(adminMock);
    generarJWT.mockResolvedValue("token-prueba");

    await loginAdmin(req, res);

    expect(AdminModel.findOne).toHaveBeenCalled();
    expect(adminMock.verificarContrasenia).toHaveBeenCalledWith("password123");
    expect(generarJWT).toHaveBeenCalledWith(1, "admin", "ADMIN-USER");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        token: "token-prueba",
      })
    );
  });

  it("debe rechazar login con contraseña invalida", async () => {
    const req = {
      body: {
        emailUsuario: "admin@test.com",
        contrasenia: "mala",
      },
    };
    const res = buildRes();

    const adminMock = {
      verificarContrasenia: jest.fn().mockResolvedValue(false),
    };

    AdminModel.findOne.mockResolvedValue(adminMock);

    await loginAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "Credenciales no válidas",
      })
    );
  });
});

describe("PU06 - Creacion de encuesta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe crear encuesta con datos validos", async () => {
    const req = {
      usuario: { id: 10 },
      body: {
        titulo: "Encuesta Empleabilidad 2026",
        estado: "BORRADOR",
        preguntas: [{ texto: "¿Trabajas actualmente?", tipo: "SI_NO" }],
      },
    };
    const res = buildRes();

    associations.Encuesta.create.mockResolvedValue({
      id: 55,
      titulo: "Encuesta Empleabilidad 2026",
      estado: "BORRADOR",
      fecha_creacion: new Date("2026-04-15T00:00:00Z"),
    });
    associations.Pregunta.create.mockResolvedValue({ id: 900 });

    await crearEncuesta(req, res);

    expect(associations.Encuesta.create).toHaveBeenCalled();
    expect(associations.Pregunta.create).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        msj: "Encuesta creada correctamente",
      })
    );
  });

  it("debe rechazar creacion sin titulo o preguntas", async () => {
    const req = {
      usuario: { id: 10 },
      body: {
        titulo: "",
        preguntas: [],
      },
    };
    const res = buildRes();

    await crearEncuesta(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "Título y preguntas son obligatorios",
      })
    );
  });
});

describe("PU09 - Gestion de usuarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe actualizar usuario con datos validos", async () => {
    const req = {
      params: { id: "5" },
      body: {
        nombre: "Egresado Actualizado",
        posicion_actual: "Backend Developer",
        empresa_actual: "Tech Corp",
        ubicacion: "Santiago",
        industria: "Tecnologia",
      },
    };
    const res = buildRes();

    const updateMock = jest.fn().mockResolvedValue();
    UserModel.findOne.mockResolvedValue({
      id: 5,
      nombre: "Nombre Anterior",
      update: updateMock,
    });
    UserModel.findByPk.mockResolvedValue({
      id: 5,
      nombre: "Egresado Actualizado",
      correo: "egresado@test.com",
      perfil_imagen_url: null,
      posicion_actual: "Backend Developer",
      empresa_actual: "tech corp",
      ubicacion: "Santiago",
      industria: "tecnologia",
      años_experiencia: null,
      nivel_educacion: null,
      especialidad_tecnica: null,
      tipo_empleo_actual: null,
      rango_salarial: null,
      disponibilidad_cambio: null,
      tecnologias_principales: null,
      area_interes: null,
      satisfaccion_laboral: null,
      opciones_personalizadas_educacion: null,
      opciones_personalizadas_tecnologias: null,
      opciones_personalizadas_area_interes: null,
      opciones_personalizadas_industria: null,
      ultimo_acceso: null,
      created_at: new Date("2026-04-15T00:00:00Z"),
      rol: "CLIENT-USER",
      activo: true,
    });

    await actualizarUsuario(req, res);

    expect(UserModel.findOne).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        msj: "Usuario actualizado correctamente",
      })
    );
  });

  it("debe rechazar gestion con id invalido", async () => {
    const req = {
      params: { id: "abc" },
      body: { nombre: "Usuario X" },
    };
    const res = buildRes();

    await actualizarUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "ID de usuario inválido",
      })
    );
  });
});

describe("PU03 - Recuperacion de contraseña", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe enviar codigo temporal con correo valido", async () => {
    const req = {
      body: { email: "admin@test.com" },
    };
    const res = buildRes();

    const updateMock = jest.fn().mockResolvedValue();
    AdminModel.findOne.mockResolvedValue({
      id: 1,
      activo: true,
      nombre_usuario: "admin",
      update: updateMock,
    });
    emailService.sendResetCode.mockResolvedValue({ success: true, messageId: "msg-1" });

    await enviarCodigoRestablecimiento(req, res);

    expect(AdminModel.findOne).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
    expect(emailService.sendResetCode).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        msj: "Código de verificación enviado al correo",
      })
    );
  });

  it("debe rechazar correo no registrado", async () => {
    const req = {
      body: { email: "noexiste@test.com" },
    };
    const res = buildRes();

    AdminModel.findOne.mockResolvedValue(null);

    await enviarCodigoRestablecimiento(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "No se encontró un administrador con ese correo",
      })
    );
  });
});

describe("PU07 - Visualizacion de reportes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe retornar metricas generales del dashboard", async () => {
    const req = { usuario: { id: 1 } };
    const res = buildRes();

    associations.Encuesta.count.mockResolvedValue(3);
    associations.Encuesta.findAll.mockResolvedValue([
      { estado: "ACTIVA", fecha_inicio: new Date("2026-04-10"), fecha_fin: null },
      { estado: "ACTIVA", fecha_inicio: new Date("2026-04-20"), fecha_fin: null },
      { estado: "BORRADOR", fecha_inicio: null, fecha_fin: null },
    ]);
    associations.Pregunta.count.mockResolvedValue(12);
    associations.Respuesta.count
      .mockResolvedValueOnce(40)
      .mockResolvedValueOnce(8);
    associations.User.count.mockResolvedValue(20);
    associations.Respuesta.findOne.mockResolvedValue({ tiempo_promedio: 180 });

    await obtenerEstadisticasGenerales(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          total_encuestas: 3,
          total_preguntas: 12,
          total_respuestas: 40,
        }),
      })
    );
  });

  it("debe manejar error interno en reportes", async () => {
    const req = { usuario: { id: 1 } };
    const res = buildRes();

    associations.Encuesta.count.mockRejectedValue(new Error("db down"));

    await obtenerEstadisticasGenerales(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "Error del servidor al obtener las estadísticas",
      })
    );
  });
});

describe("PU08 - Visualizacion de resultados de encuesta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe retornar resultados exportables de encuesta existente", async () => {
    const req = { params: { id: "55" }, usuario: { id: 1 } };
    const res = buildRes();

    associations.Encuesta.findOne.mockResolvedValue({
      id: 55,
      titulo: "Encuesta 2026",
      descripcion: "Resultados",
      estado: "ACTIVA",
    });
    associations.Respuesta.findAll
      .mockResolvedValueOnce([
        {
          usuario_id: 5,
          fecha_respuesta: new Date("2026-04-15T10:00:00Z"),
          respuesta: "1",
          pregunta_id: 1,
          usuario: { nombre: "Juan", correo: "juan@test.com" },
          pregunta: { texto: "Pregunta 1", tipo: "OPCION_UNICA", orden: 1 },
        },
      ])
      .mockResolvedValueOnce([{ respuesta: "1" }]);
    associations.Pregunta.findAll.mockResolvedValue([
      { id: 1, texto: "Pregunta 1", tipo: "OPCION_UNICA", orden: 1, es_requerida: true },
    ]);

    await exportarDatosEncuesta(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          total_respuestas: 1,
        }),
      })
    );
  });

  it("debe devolver 404 si la encuesta no existe", async () => {
    const req = { params: { id: "9999" }, usuario: { id: 1 } };
    const res = buildRes();

    associations.Encuesta.findOne.mockResolvedValue(null);

    await exportarDatosEncuesta(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "Encuesta no encontrada",
      })
    );
  });
});

describe("PU05 - Login con LinkedIn (egresado)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe autenticar con linkedinData valido", async () => {
    const req = {
      body: {
        linkedinData: {
          linkedin_id: "ln-123",
          nombre: "Egresado LinkedIn",
          correo: "egresado@linkedin.com",
          empresa_actual: "Tech Company",
          industria: "Tecnologia",
        },
      },
    };
    const res = buildRes();

    UserModel.findOne.mockResolvedValue(null);
    UserModel.create.mockResolvedValue({
      id: 77,
      nombre: "Egresado LinkedIn",
      rol: "CLIENT-USER",
    });
    generarJWT.mockResolvedValue("token-linkedin");

    await loginLinkedIn(req, res);

    expect(UserModel.create).toHaveBeenCalled();
    expect(generarJWT).toHaveBeenCalledWith(77, "Egresado LinkedIn", "CLIENT-USER");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        token: "token-linkedin",
      })
    );
  });

  it("debe rechazar linkedinData incompleto", async () => {
    const req = {
      body: {
        linkedinData: {
          linkedin_id: "ln-123",
          nombre: "Egresado LinkedIn",
        },
      },
    };
    const res = buildRes();

    await loginLinkedIn(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "Datos de LinkedIn incompletos",
      })
    );
  });
});

describe("PU04 - Centro de notificaciones", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe listar notificaciones para usuario autenticado", async () => {
    const req = {
      usuario: { id: 5 },
      query: { page: "1", limit: "20" },
    };
    const res = buildRes();

    associations.Notificacion.findAndCountAll.mockResolvedValue({
      rows: [{ id: 1, titulo: "Nueva encuesta", leida: false }],
      count: 1,
    });

    await obtenerNotificaciones(req, res);

    expect(associations.Notificacion.findAndCountAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          total: 1,
        }),
      })
    );
  });

  it("debe manejar error en consulta de notificaciones", async () => {
    const req = {
      usuario: { id: 5 },
      query: {},
    };
    const res = buildRes();

    associations.Notificacion.findAndCountAll.mockRejectedValue(new Error("db fail"));

    await obtenerNotificaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "Error del servidor al obtener las notificaciones",
      })
    );
  });
});

describe("PU10 - Salir del sistema (sesion/token)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe denegar acceso cuando no hay token (logout efectivo)", async () => {
    const req = {
      header: jest.fn().mockReturnValue(undefined),
    };
    const res = buildRes();
    const next = jest.fn();

    await verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "No hay token en la petición",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("debe denegar acceso cuando token es invalido", async () => {
    const req = {
      header: jest.fn().mockReturnValue("token-malformado"),
    };
    const res = buildRes();
    const next = jest.fn();

    const verifySpy = jest.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("invalid token");
    });

    await verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        msj: "Token no válido",
      })
    );
    expect(next).not.toHaveBeenCalled();

    verifySpy.mockRestore();
  });
});
