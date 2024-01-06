import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsPositive } from "class-validator";
import { BrickType, WallThicknessType } from "../calc.service";

export class CalculateBrickQuantityByVolumeDto {
  @ApiProperty()
  @IsNumber()
  brickType: BrickType;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  bricklayingVolume: number;

  @ApiProperty()
  @IsBoolean()
  mortarSeamEnabled: boolean;
}

export class CalculateBrickQuantityByParametersDto {
  @ApiProperty()
  @IsNumber()
  wallThicknessType: WallThicknessType;

  @ApiProperty()
  @IsNumber()
  brickType: BrickType;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  wallHeight: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  wallLength: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  frameHeight: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  frameWidth: number;

  @ApiProperty()
  @IsBoolean()
  mortarSeamEnabled: boolean;
}
