import { Controller, Post, Body, ValidationPipe } from "@nestjs/common";
import { BrickType, CalcService, WallThicknessType } from "./calc.service";

@Controller("calc")
export class CalcController {
  constructor(private readonly calcService: CalcService) {}

  @Post("byVolume")
  calculateBrickQuantityByVolume(
    @Body(new ValidationPipe({ transform: true }))
    data: {
      brickType: BrickType;
      bricklayingVolume: number;
      mortarSeamEnabled: boolean;
    },
  ): number {
    const { brickType, bricklayingVolume, mortarSeamEnabled } = data;
    return this.calcService.calculateBrickQuantityByVolume(
      brickType,
      bricklayingVolume,
      mortarSeamEnabled,
    );
  }

  @Post("byParameters")
  calculateBrickQuantityByParameters(
    @Body(new ValidationPipe({ transform: true }))
    data: {
      wallThicknessType: WallThicknessType;
      brickType: BrickType;
      wallHeight: number;
      wallLength: number;
      frameHeight: number;
      frameWidth: number;
      mortarSeamEnabled: boolean;
    },
  ): number {
    const {
      wallThicknessType,
      brickType,
      wallHeight,
      wallLength,
      frameHeight,
      frameWidth,
      mortarSeamEnabled,
    } = data;
    return this.calcService.calculateBrickQuantityByParameters(
      wallThicknessType,
      brickType,
      wallHeight,
      wallLength,
      frameHeight,
      frameWidth,
      mortarSeamEnabled,
    );
  }
}
