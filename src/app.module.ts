import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CategoryController } from "./category/category.controller";
import { ItemController } from "./item/item.controller";
import { OrderController } from "./order/order.controller";
import { CategoryService } from "./category/category.service";
import { ItemService } from "./item/item.service";
import { OrderService } from "./order/order.service";
import { Category, CategorySchema } from "./category/schema/category";
import * as dotenv from "dotenv";
import { Item, ItemSchema } from "./item/schema/item";
import { Order, OrderSchema } from "./order/schema/order";
import { PaymentProvider } from "./payment/payment.provider";
import { ScheduleModule } from "@nestjs/schedule";
import { Payment, PaymentSchema } from "./payment/schema/payment";
import { Auth, AuthSchema } from "./auth/schema/auth";
import { AppController } from "./app.controller";
import { MailModule } from "./mail/mail.module";
import { TelegramAPIModule } from "./telegram/telegram.module";
import { CalcModule } from "./calc/calc.module";
import { GalleryController } from "./gallery/gallery.controller";
import { GalleryService } from "./gallery/gallery.service";
import { Project, ProjectSchema } from "./gallery/schema/gallery";
import { TelegramAPIService } from './telegram/telegram.service';
import { ConfigModule, ConfigService } from "@nestjs/config";
dotenv.config();

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env["MONGO_DSN"]!),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Item.name, schema: ItemSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Auth.name, schema: AuthSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    MailModule,
    TelegramAPIModule,
    CalcModule,
  ],
  controllers: [
    CategoryController,
    ItemController,
    OrderController,
    AppController,
    GalleryController,
  ],
  providers: [
    ConfigService,
    CategoryService,
    ItemService,
    OrderService,
    PaymentProvider,
    GalleryService,
    TelegramAPIService
  ],
})
export class AppModule {}
