import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PaymentProvider } from "./payment.provider";
import { PaymentController } from "./payment.controller";
import { Payment, PaymentSchema } from "./schema/payment";
import { OrderModule } from "../order/order.module";

@Module({
  imports: [
    OrderModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  controllers: [PaymentController],
  providers: [PaymentProvider],
})
export class PaymentModule {}
