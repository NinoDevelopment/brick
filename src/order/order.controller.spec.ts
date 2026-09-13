import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { AuthGuard } from "../auth/auth.guard";
import { TelegramAPIService } from "../telegram/telegram.service";
import { MailService } from "../mail/mail.service";
import { generateOrderAccessToken } from "./order-access-token";

const mongoId = "507f1f77bcf86cd799439011";
const accessToken = generateOrderAccessToken();
const publicStatus = {
  _id: mongoId,
  orderId: "2026000001",
  amount: 1200,
  paid: false,
  completed: false,
  paymentType: "CASH",
  deliveryType: "COURIER",
  address: { city: "Нижний Новгород", address: "ул. Тайная, 1" },
  positions: [{ itemId: "item1", quantity: 400, pack: 400 }],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("OrderController public status", () => {
  let app: INestApplication;
  const orderService = {
    findPublicStatus: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    calculateOrderAmount: jest.fn(),
    lookupCompanyByInn: jest.fn(),
    complete: jest.fn(),
    getPromocodes: jest.fn(),
    createPromocode: jest.fn(),
    removePromocode: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        { provide: OrderService, useValue: orderService },
        { provide: TelegramAPIService, useValue: { sendCallmeRequest: jest.fn() } },
        { provide: MailService, useValue: { sendCallmeRequest: jest.fn() } },
      ],
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
  });

  it("GET /order/:id?token= returns public status for a valid token", async () => {
    orderService.findPublicStatus.mockResolvedValue(publicStatus);

    const response = await request(app.getHttpServer())
      .get(`/order/${mongoId}`)
      .query({ token: accessToken })
      .expect(200);

    expect(orderService.findPublicStatus).toHaveBeenCalledWith(mongoId, accessToken);
    expect(response.body._id).toBe(mongoId);
    expect(response.body).not.toHaveProperty("phoneNumber");
    expect(response.body).not.toHaveProperty("accessToken");
  });

  it("GET /order/:id with another order token is not found", async () => {
    orderService.findPublicStatus.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get(`/order/${mongoId}`)
      .query({ token: generateOrderAccessToken() })
      .expect(404);

    expect(orderService.findPublicStatus).toHaveBeenCalled();
  });

  it("GET /order/:id without a token is not found", async () => {
    orderService.findPublicStatus.mockResolvedValue(null);

    await request(app.getHttpServer()).get(`/order/${mongoId}`).expect(404);
    expect(orderService.findPublicStatus).toHaveBeenCalledWith(mongoId, undefined);
  });

  it("GET /order/:id with an empty token is not found", async () => {
    orderService.findPublicStatus.mockResolvedValue(null);

    await request(app.getHttpServer()).get(`/order/${mongoId}`).query({ token: "" }).expect(404);
  });

  it("GET /order remains an admin list endpoint", async () => {
    await request(app.getHttpServer()).get("/order").expect(200);
    expect(orderService.findAll).toHaveBeenCalled();
  });
});
