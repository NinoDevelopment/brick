import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import request from "supertest";
import { AppController } from "./app.controller";
import { AuthGuard } from "./auth/auth.guard";
import { Auth } from "./auth/schema/auth";
import { ADMIN_COOKIE_NAME } from "./auth/admin-cookie";

const password = "live_1a6e367438327f2cf9c0d30b2f4aeac7";
const apiKey =
  "$argon2id$v=19$m=64000,t=3,p=1$2IbVQxRSJOHC5ogg70uqsQ$4oOHqflmaKDMsjP1TYgTjtHs0/PUl1c63a5YK/fLsvM";

describe("AppController auth", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AuthGuard,
        {
          provide: getModelToken(Auth.name),
          useValue: {
            find: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([{ apiKey }]),
            }),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("POST /api/auth with a valid header sets HttpOnly cookie", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth")
      .set("Authorization", password)
      .expect(201);

    expect(response.body).toBe(true);
    const setCookie = response.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    const cookie = Array.isArray(setCookie) ? setCookie.join(";") : String(setCookie);
    expect(cookie).toContain(`${ADMIN_COOKIE_NAME}=`);
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });

  it("POST /api/auth with a valid cookie authenticates without Authorization", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth")
      .set("Cookie", `${ADMIN_COOKIE_NAME}=${password}`)
      .expect(201);

    expect(response.body).toBe(true);
  });

  it("POST /api/auth without credentials is unauthorized", async () => {
    await request(app.getHttpServer()).post("/api/auth").expect(401);
  });

  it("POST /api/auth with an invalid key is forbidden", async () => {
    await request(app.getHttpServer())
      .post("/api/auth")
      .set("Authorization", "invalid-key")
      .expect(403);
  });

  it("POST /api/logout clears the admin cookie without authentication", async () => {
    const response = await request(app.getHttpServer()).post("/api/logout").expect(201);

    expect(response.body).toEqual({ success: true });
    const setCookie = response.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    const cookie = Array.isArray(setCookie) ? setCookie.join(";") : String(setCookie);
    expect(cookie).toContain(`${ADMIN_COOKIE_NAME}=`);
    expect(cookie.toLowerCase()).toMatch(/max-age=0|expires=/);
  });
});
