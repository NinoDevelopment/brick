import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { ItemController } from "./item.controller";
import { ItemService } from "./item.service";
import { AuthGuard } from "../auth/auth.guard";

const mongoId = "507f1f77bcf86cd799439011";

describe("ItemController", () => {
  let app: INestApplication;
  const itemService = {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue({ name: "brick" }),
    findByCategoryId: jest.fn().mockResolvedValue([]),
    findRandom: jest.fn().mockResolvedValue([{ name: "sample" }]),
    findRecommendations: jest.fn().mockResolvedValue([{ name: "rec" }]),
    findImages: jest.fn().mockResolvedValue({ _id: mongoId, images: ["img"] }),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ItemController],
      providers: [{ provide: ItemService, useValue: itemService }],
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
    itemService.findRandom.mockResolvedValue([{ name: "sample" }]);
    itemService.findRecommendations.mockResolvedValue([{ name: "rec" }]);
    itemService.findImages.mockResolvedValue({ _id: mongoId, images: ["img"] });
    itemService.findById.mockResolvedValue({ name: "brick" });
  });

  it("GET /item/sample/:size does not collide with :id", async () => {
    await request(app.getHttpServer()).get("/item/sample/3").expect(200);
    expect(itemService.findRandom).toHaveBeenCalledWith(3);
    expect(itemService.findById).not.toHaveBeenCalled();
  });

  it("GET /item/recommendations/:size does not collide with :id", async () => {
    await request(app.getHttpServer()).get("/item/recommendations/2").expect(200);
    expect(itemService.findRecommendations).toHaveBeenCalledWith(2);
    expect(itemService.findById).not.toHaveBeenCalled();
  });

  it("GET /item/images/:id returns images array", async () => {
    await request(app.getHttpServer()).get(`/item/images/${mongoId}`).expect(200);
    expect(itemService.findImages).toHaveBeenCalledWith(mongoId);
    expect(itemService.findById).not.toHaveBeenCalled();
  });
});
