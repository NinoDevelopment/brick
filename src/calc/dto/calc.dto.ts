import { IsBoolean, IsNumber, IsPositive } from "class-validator";
import { BrickType, WallThicknessType } from "../calc.service";

export class CalculateBrickQuantityByVolumeDto {
  @IsNumber()
  brickType: BrickType;

  @IsNumber()
  @IsPositive()
  bricklayingVolume: number;

  @IsBoolean()
  mortarSeamEnabled: boolean;
}

export class CalculateBrickQuantityByParametersDto {
  @IsNumber()
  wallThicknessType: WallThicknessType;

  @IsNumber()
  brickType: BrickType;

  @IsNumber()
  @IsPositive()
  wallHeight: number;

  @IsNumber()
  @IsPositive()
  wallLength: number;

  @IsNumber()
  @IsPositive()
  frameHeight: number;

  @IsNumber()
  @IsPositive()
  frameWidth: number;

  @IsBoolean()
  mortarSeamEnabled: boolean;
}
