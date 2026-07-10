import { Module } from "@nestjs/common";
import { TelegramModule } from "nestjs-telegram";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TelegramAPIService } from "./telegram.service";

function unquote(value?: string | null): string {
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

@Module({
  imports: [
    ConfigModule,
    TelegramModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        botKey: unquote(configService.getOrThrow("TELEGRAM_API_KEY")),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TelegramAPIService],
  exports: [TelegramAPIService],
})
export class TelegramAPIModule {}
