import { Controller, Get, Query, ParseIntPipe, ParseBoolPipe } from "@nestjs/common";
import { BrickType, CalcService, WallThicknessType } from "./calc.service";

@Controller("calc")
export class CalcController {
  constructor(private readonly calcService: CalcService) {}

  @Get("byVolume")
  calculateBrickQuantityByVolume(
    @Query("brickType", ParseIntPipe) brickType: BrickType,
    @Query("bricklayingVolume", ParseIntPipe) bricklayingVolume: number,
    @Query("mortarSeamEnabled", ParseBoolPipe) mortarSeamEnabled: boolean,
  ): number {
    return this.calcService.calculateBrickQuantityByVolume(
      brickType,
      bricklayingVolume,
      mortarSeamEnabled,
    );
  }

  @Get("byParameters")
  calculateBrickQuantityByParameters(
    @Query("wallThicknessType", ParseIntPipe) wallThicknessType: WallThicknessType,
    @Query("brickType", ParseIntPipe) brickType: BrickType,
    @Query("wallHeight", ParseIntPipe) wallHeight: number,
    @Query("wallLength", ParseIntPipe) wallLength: number,
    @Query("frameHeight", ParseIntPipe) frameHeight: number,
    @Query("frameWidth", ParseIntPipe) frameWidth: number,
    @Query("mortarSeamEnabled", ParseBoolPipe) mortarSeamEnabled: boolean,
  ): number {
    return this.calcService.calculateBrickQuantity(
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
