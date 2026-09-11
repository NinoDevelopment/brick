import { Test, TestingModule } from "@nestjs/testing";
import { MailService, vatIncludedInAmount } from "./mail.service";
import { DeliveryType, PaymentType, Order } from "../order/schema/order";
import { ConfigModule } from "@nestjs/config";
import { SmtpMailer } from "./smtp-mailer";
import * as fs from "fs";
import * as path from "path";

describe("MailService", () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        MailService,
        {
          provide: SmtpMailer,
          useValue: { sendMail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("extracts VAT 22/122 from amount including tax", () => {
    expect(vatIncludedInAmount(122)).toBe(22);
    expect(vatIncludedInAmount(1_209_860)).toBeCloseTo(218_171.48, 2);
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

    const pdfBytes = await service.generatePDFWithText(preparedOrder, positions);
    expect(pdfBytes.subarray(0, 5).toString()).toBe("%PDF-");

    const samplePath = path.join(__dirname, "..", "..", "generated", "invoice-sample.pdf");
    fs.mkdirSync(path.dirname(samplePath), { recursive: true });
    fs.writeFileSync(samplePath, pdfBytes);
  });
});
