import { Controller, Post, Body } from "@nestjs/common";
import { CalcResult, CalcService } from "./calc.service";
import {
  CalculateBrickQuantityByVolumeDto,
  CalculateBrickQuantityByParametersDto,
} from "./dto/calc.dto";

@Controller("calc")
export class CalcController {
  constructor(private readonly calcService: CalcService) {}

  @Post("byVolume")
  calculateBrickQuantityByVolume(@Body() params: CalculateBrickQuantityByVolumeDto): CalcResult {
    return this.calcService.calculateBrickQuantityByVolume(
      params.brickType,
      params.bricklayingVolume,
      params.mortarSeamEnabled,
    );
  }

  @Post("byParameters")
  calculateBrickQuantityByParameters(
    @Body() params: CalculateBrickQuantityByParametersDto,
  ): CalcResult {
    return this.calcService.calculateBrickQuantityByParameters(
      params.wallThicknessType,
      params.brickType,
      params.wallHeight,
      params.wallLength,
      params.frameHeight,
      params.frameWidth,
      params.mortarSeamEnabled,
    );
  }
}
