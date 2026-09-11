import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AuthGuard } from "../auth/auth.guard";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";

const mongoId = "507f1f77bcf86cd799439011";

describe("MediaController", () => {
  let app: INestApplication;
  const mediaService = {
    saveUploadedFiles: jest
      .fn()
      .mockResolvedValue([`https://kzk.ooo/api/media/items/${mongoId}/0.webp`]),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: mediaService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mediaService.saveUploadedFiles.mockResolvedValue([
      `https://kzk.ooo/api/media/items/${mongoId}/0.webp`,
    ]);
  });

  it("POST /media/upload writes files and returns urls", async () => {
    await request(app.getHttpServer())
      .post("/media/upload")
      .field("entity", "items")
      .field("id", mongoId)
      .attach(
        "files",
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64",
        ),
        {
          filename: "pixel.png",
          contentType: "image/png",
        },
      )
      .expect(201);

    expect(mediaService.saveUploadedFiles).toHaveBeenCalledWith(
      "items",
      mongoId,
      expect.arrayContaining([expect.objectContaining({ mimetype: "image/png" })]),
    );
  });

  it("POST /media/upload rejects unknown entity", async () => {
    await request(app.getHttpServer())
      .post("/media/upload")
      .field("entity", "other")
      .field("id", mongoId)
      .attach("files", Buffer.from("x"), { filename: "pixel.png", contentType: "image/png" })
      .expect(400);
  });
});
