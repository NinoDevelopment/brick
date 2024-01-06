import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsPositive, Validate } from "class-validator";
import { CheckFrameHeight, CheckFrameWidth } from "./validators";

export class CalculateBrickQuantityByVolumeDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  brickType: number;

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
  @IsPositive()
  wallThicknessType: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  brickType: number;

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
  @Validate(CheckFrameHeight)
  frameHeight: number;

  @ApiProperty()
  @IsNumber()
  @Validate(CheckFrameWidth)
  frameWidth: number;

  @ApiProperty()
  @IsBoolean()
  mortarSeamEnabled: boolean;
}
