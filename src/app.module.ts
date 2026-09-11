import { ExecutionContext, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { CalcModule } from "./calc/calc.module";
import { AuthModule } from "./auth/auth.module";
import { CategoryModule } from "./category/category.module";
import { ItemModule } from "./item/item.module";
import { OrderModule } from "./order/order.module";
import { GalleryModule } from "./gallery/gallery.module";
import { PaymentModule } from "./payment/payment.module";
import { MediaModule } from "./media/media.module";
import { AppController } from "./app.controller";
import { unquote } from "./common/unquote";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 120 }],
      skipIf: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest<{ path?: string; url?: string }>();
        const path = request.path ?? request.url ?? "";
        return path.startsWith("/media");
      },
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: unquote(config.getOrThrow("MONGO_DSN")),
        autoIndex: true,
      }),
    }),
    AuthModule,
    MediaModule,
    CategoryModule,
    ItemModule,
    OrderModule,
    PaymentModule,
    GalleryModule,
    CalcModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
