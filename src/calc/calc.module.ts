import { Module } from '@nestjs/common';
import { CalcService } from './calc.service';
import { CalcController } from './calc.controller';

@Module({
  providers: [CalcService],
  controllers: [CalcController]
})
export class CalcModule {}
