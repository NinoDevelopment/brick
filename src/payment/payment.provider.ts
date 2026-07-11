import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Payment, PaymentDocument, PaymentStatus } from "./schema/payment";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { YooCheckout, ICreatePayment } from "@a2seven/yoo-checkout";
import { OrderService } from "src/order/order.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PaymentProvider {
  private readonly logger = new Logger(PaymentProvider.name);
  private readonly url: string;
  private yooCheckout: YooCheckout;

  constructor(
    private orderService: OrderService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private config: ConfigService,
  ) {
    const shopId = this.unquote(process.env["KASSA_SHOP_ID"]);
    const secretKey = this.unquote(process.env["KASSA_API_KEY"]);
    if (!shopId || !secretKey) {
      throw new Error("KASSA_SHOP_ID / KASSA_API_KEY не заданы");
    }
    this.yooCheckout = new YooCheckout({ shopId, secretKey });
    this.url = this.unquote(this.config.getOrThrow("URL"));
  }

  async create(orderId: string): Promise<Payment> {
    const order = await this.orderService.findById(orderId);
    if (order == null) throw new NotFoundException(`заказ ${orderId} не найден`);

    if (order.paid || order.completed) {
      throw new BadRequestException(`заказ ${orderId} уже оплачен или завершен`);
    }

    const existingPayment = await this.paymentModel
      .findOne({ orderId, status: PaymentStatus.PENDING })
      .exec();
    if (existingPayment) {
      return existingPayment;
    }

    const createPayload: ICreatePayment = {
      amount: {
        value: Number(order.amount).toFixed(2),
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: `https://${this.url}/order/status/${orderId}`,
      },
      capture: true,
      description: `Платеж за заказ №${order.orderId} на сумму ${order.amount}`,
    };

    let yooPayment;
    try {
      yooPayment = await this.yooCheckout.createPayment(createPayload);
    } catch (error) {
      const yooError = this.extractYooError(error);
      this.logger.error(`YooKassa createPayment failed: ${JSON.stringify(yooError)}`);
      throw new InternalServerErrorException("Не удалось создать платёж в ЮKassa");
    }

    this.logger.log(`YooKassa payment created: ${yooPayment.id}`);

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

  private unquote(value?: string | null): string {
    if (!value) return "";
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }

  private extractYooError(error: unknown): Record<string, unknown> {
    if (!error || typeof error !== "object") {
      return { raw: String(error) };
    }
    const err = error as {
      response?: { status?: number; data?: unknown };
      message?: string;
      code?: string;
      description?: string;
      type?: string;
      id?: string;
      parameter?: string;
    };
    const data = err.response?.data;
    if (data && typeof data === "object") {
      return {
        httpStatus: err.response?.status,
        ...(data as Record<string, unknown>),
      };
    }
    return {
      httpStatus: err.response?.status,
      message: err.message,
      code: err.code,
      description: err.description,
      type: err.type,
      id: err.id,
      parameter: err.parameter,
      data,
    };
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkReceivedPayments() {
    const pendingPayments = await this.paymentModel.find({ status: PaymentStatus.PENDING }).exec();
    await Promise.all(
      pendingPayments.map(async (pay) => {
        try {
          await this.checkPaymentStatus(pay);
        } catch (error) {
          this.logger.error(`Ошибка проверки платежа ${pay.yooId}: ${String(error)}`);
        }
      }),
    );
  }

  private async checkPaymentStatus(pay: PaymentDocument) {
    const yooPayment = await this.yooCheckout.getPayment(pay.yooId);
    switch (yooPayment.status) {
      case "succeeded":
        if (Number(yooPayment.amount.value) !== Number(pay.amount)) {
          this.logger.error(`Сумма платежа ${yooPayment.id} не совпадает с заказом ${pay.orderId}`);
          return;
        }
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
