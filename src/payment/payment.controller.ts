import { Controller, Param, Post } from "@nestjs/common";
import { PaymentProvider } from "./payment.provider";
import { FindOneParams } from "../order/dto/order.dto";

@Controller("order")
export class PaymentController {
  constructor(private paymentProvider: PaymentProvider) {}

  @Post("plati/:id")
  async payForOrder(@Param() params: FindOneParams): Promise<{ confirmationURL: string }> {
    const payment = await this.paymentProvider.create(params.id);
    return { confirmationURL: payment.confirmURL };
  }
}
