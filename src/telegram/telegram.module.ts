import { Module } from '@nestjs/common';
import { TelegramModule } from 'nestjs-telegram';
import { ConfigService } from '@nestjs/config';
import { TelegramAPIService } from './telegram.service';

@Module({
  imports: [
    TelegramModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        botKey: configService.getOrThrow('TELEGRAM_API_KEY')
      }),
      inject: [ConfigService]
    })
  ],
  providers: [TelegramAPIService],
  exports: [TelegramAPIService],
})
export class TelegramAPIModule {}