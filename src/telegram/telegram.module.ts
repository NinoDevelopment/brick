import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TelegramAPIService } from "./telegram.service";
import { TelegramBotClient } from "./telegram-bot.client";

@Module({
  imports: [ConfigModule],
  providers: [TelegramBotClient, TelegramAPIService],
  exports: [TelegramAPIService],
})
export class TelegramAPIModule {}
