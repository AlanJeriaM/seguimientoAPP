const { generarJWT, verificarJWT } = require("../jwt");

describe("Servicio JWT", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key";
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("debe generar un token valido", async () => {
    const token = await generarJWT(1, "admin", "ADMIN-USER");

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });

  it("debe verificar un token valido y retornar payload", async () => {
    const token = await generarJWT(10, "egresado", "CLIENT-USER");
    const payload = await verificarJWT(token);

    expect(payload).toEqual(
      expect.objectContaining({
        id: 10,
        nombreUsuario: "egresado",
        rol: "CLIENT-USER",
      })
    );
  });

  it("debe rechazar un token invalido", async () => {
    await expect(verificarJWT("token-invalido")).rejects.toBe("Token no válido");
  });
});
