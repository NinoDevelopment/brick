import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { Order, OrderSchema, Promocode, PromocodeSchema } from "./schema/order";
import { ItemModule } from "../item/item.module";
import { MailModule } from "../mail/mail.module";
import { TelegramAPIModule } from "../telegram/telegram.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    ItemModule,
    MailModule,
    TelegramAPIModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Promocode.name, schema: PromocodeSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
