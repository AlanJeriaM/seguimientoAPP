const request = require("supertest");
const app = require("../app");

describe("Integracion basica API", () => {
  it("GET /api/health responde ok", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        message: expect.any(String),
      })
    );
  });

  it("ruta inexistente responde 404", async () => {
    const response = await request(app).get("/api/ruta-inexistente");

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: false,
      })
    );
  });
});
