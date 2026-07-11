import { Test, TestingModule } from "@nestjs/testing";
import { MailService } from "./mail.service";
import { DeliveryType, PaymentType, Order } from "../order/schema/order";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";

describe("MailService", () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        MailerModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            transport: {
              host: configService.get("MAIL_HOST"),
              port: configService.get("MAIL_PORT"),
              secure: false,
              auth: {
                user: configService.get("MAIL_USER"),
                pass: configService.get("MAIL_PASSWORD"),
              },
            },
            defaults: {
              from: `"No Reply" <${configService.get("MAIL_FROM")}>`,
            },
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should generate PDF with text", async () => {
    const mockOrder: Order = {
      orderId: "2024123456",
      phoneNumber: "1234567890",
      email: "johndoe@gmail.com",
      fullName: "John Doe",
      address: {
        address: "123 Main St",
        addressName: "Home",
        city: "NYC",
        flat: "Apt 101",
        entrance: "Front",
        intercom: "1234",
        floor: 1,
        commentAddress: "Near the park",
      },
      shopAddress: "456 Market St",
      completed: false,
      positions: [
        {
          itemId: "item123",
          price: 19.4,
          quantity: 59400,
          pack: 400,
        },
        {
          itemId: "item456",
          price: 35,
          quantity: 1000,
          pack: 400,
        },
        {
          itemId: "item446",
          price: 15,
          quantity: 1500,
          pack: 400,
        },
      ],
      amount: 35,
      createdAt: new Date(),
      deliveryType: DeliveryType.COURIER,
      paid: false,
      paymentType: PaymentType.SCHET,
      promocode: "SOME_PROMO_CODE",
      schetInfo: {
        companyName: "ООО «Строительные технологии»",
        companyAddress: "Нижегородская обл., г. Нижний Новгород, ул. Деловая, дом № 19, офис 10",
        inn: "5260425364",
        kpp: "526001001",
      },
    };

    const preparedOrder = await service.prepareOrder(mockOrder);
    const positions = [
      { itemId: "item123", name: "Кирпич облицовочный", price: 19.4, quantity: 59400 },
      { itemId: "item456", name: "Кирпич строительный", price: 35, quantity: 1000 },
      { itemId: "item446", name: "Кирпич рядовой", price: 15, quantity: 1500 },
    ];

    await expect(service.generatePDFWithText(preparedOrder, positions)).resolves.toBeUndefined();

    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const outputPath = path.join(__dirname, "templates", "order.pdf");
    const samplePath = path.join(__dirname, "..", "..", "generated", "invoice-sample.pdf");

    expect(fs.existsSync(outputPath)).toBe(true);
    const pdfHeader = fs.readFileSync(outputPath).subarray(0, 5).toString();
    expect(pdfHeader).toBe("%PDF-");

    fs.mkdirSync(path.dirname(samplePath), { recursive: true });
    fs.copyFileSync(outputPath, samplePath);
  });
});
