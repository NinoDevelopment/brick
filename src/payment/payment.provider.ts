import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Payment, PaymentDocument, PaymentStatus } from "./schema/payment";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { YooCheckout, ICreatePayment } from "@a2seven/yoo-checkout";
import { OrderService } from "src/order/order.service";

const RETURN_URL = "https://hleb365.ru/order/status";

@Injectable()
export class PaymentProvider {
  private readonly logger = new Logger(PaymentProvider.name);

  private yooCheckout: YooCheckout;

  constructor(
    private orderService: OrderService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
  ) {
    this.yooCheckout = new YooCheckout({
      shopId: process.env["KASSA_SHOP_ID"]!,
      secretKey: process.env["KASSA_API_KEY"]!,
    });
  }

  async create(orderId: string): Promise<Payment> {
    const order = await this.orderService.findById(orderId);
    if (order == null) throw new NotFoundException(`заказ ${orderId} не найден`);

    if (order.paid || order.completed) {
      throw new BadRequestException(`заказ ${orderId} уже оплачен или завершен`);
    }

    const createPayload: ICreatePayment = {
      amount: {
        value: order.amount.toString(),
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: `${RETURN_URL}/${orderId}`,
      },
      capture: true,
      description: `Платеж за заказ №${orderId} на сумму ${order.amount}`,
    };

    const yooPayment = await this.yooCheckout.createPayment(createPayload);

    console.log(yooPayment);

    const paymentToCreate: Payment = {
      orderId: orderId,
      amount: order.amount!,
      yooId: yooPayment.id,
      confirmURL: yooPayment.confirmation.confirmation_url!,
      paid: false,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
    };

    const payment = new this.paymentModel(paymentToCreate);
    return payment.save();
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkReceivedPayments() {
    const pendingPayments = await this.paymentModel.find({ status: PaymentStatus.PENDING }).exec();
    await Promise.all(pendingPayments.map(this.checkPaymentStatus.bind(this)));
  }

  private async checkPaymentStatus(pay: PaymentDocument) {
    const yooPayment = await this.yooCheckout.getPayment(pay.yooId);
    console.log(yooPayment);
    switch (yooPayment.status) {
      case "succeeded":
        pay.status = PaymentStatus.SUCCEEDED;
        pay.paid = true;
        await this.orderService.setPaid(pay.orderId, true);
        this.logger.log(`Заказ ${pay.orderId} оплачен платежом ${yooPayment.id}`);
        break;
      case "canceled":
        pay.status = PaymentStatus.CANCELED;
        this.logger.log(`платеж ${yooPayment.id} отменен`);
        break;
    }
    await pay.save();
  }
}
