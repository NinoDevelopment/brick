import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { OrderService } from "./order.service";
import { Order, DeliveryType, PaymentType, Promocode } from "./schema/order";
import { MailService } from "../mail/mail.service";
import { ItemService } from "../item/item.service";
import { TelegramAPIService } from "../telegram/telegram.service";
import { generateOrderAccessToken } from "./order-access-token";

const mongoId = "507f1f77bcf86cd799439011";
const accessToken = generateOrderAccessToken();

const publicOrderDoc = {
  _id: { toString: () => mongoId },
  orderId: "2026000001",
  accessToken,
  phoneNumber: "+7(900)000-00-00",
  email: "secret@example.com",
  fullName: "Иван Секрет",
  amount: 1200,
  paid: false,
  completed: false,
  paymentType: PaymentType.CASH,
  deliveryType: DeliveryType.COURIER,
  shopAddress: undefined,
  address: { city: "Нижний Новгород", address: "ул. Тайная, 1" },
  positions: [{ itemId: "item1", quantity: 400, pack: 400 }],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("OrderService public status", () => {
  let service: OrderService;
  const orderModel = {
    findById: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Promocode.name), useValue: {} },
        { provide: MailService, useValue: { sendOrder: jest.fn() } },
        { provide: ItemService, useValue: {} },
        { provide: TelegramAPIService, useValue: { sendOrder: jest.fn() } },
      ],
    }).compile();

    service = module.get(OrderService);
    jest.clearAllMocks();
    orderModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(publicOrderDoc),
    });
  });

  it("returns the public DTO when the access token matches", async () => {
    const result = await service.findPublicStatus(mongoId, accessToken);

    expect(result).toMatchObject({
      _id: mongoId,
      orderId: "2026000001",
      amount: 1200,
      address: { city: "Нижний Новгород", address: "ул. Тайная, 1" },
    });
    expect(result).not.toHaveProperty("accessToken");
    expect(result).not.toHaveProperty("phoneNumber");
    expect(result).not.toHaveProperty("fullName");
    expect(result).not.toHaveProperty("email");
  });

  it("rejects access to another party's order", async () => {
    await expect(service.findPublicStatus(mongoId, generateOrderAccessToken())).resolves.toBeNull();
  });

  it("rejects a request without a token", async () => {
    await expect(service.findPublicStatus(mongoId)).resolves.toBeNull();
    expect(orderModel.findById).not.toHaveBeenCalled();
  });

  it("rejects public access when the order has no access token", async () => {
    orderModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ ...publicOrderDoc, accessToken: undefined }),
    });
    await expect(service.findPublicStatus(mongoId, accessToken)).resolves.toBeNull();
  });

  it("rejects public access when the order does not exist", async () => {
    orderModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(service.findPublicStatus(mongoId, accessToken)).resolves.toBeNull();
  });

  it("omits accessToken from the admin list", async () => {
    const select = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
    orderModel.find.mockReturnValue({ select });

    await service.findAll();

    expect(select).toHaveBeenCalledWith("-accessToken");
  });
});
