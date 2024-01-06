import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsPositive, Validate } from "class-validator";
import { CheckFrameHeight, CheckFrameWidth, CheckListValidator } from "./validators";

export class CalculateBrickQuantityByVolumeDto {
  @ApiProperty()
  @IsNumber()
  @Validate(CheckListValidator, ["brickType", [1, 2]])
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
  @Validate(CheckListValidator, ["wallThicknessType", [1, 2, 3, 4, 5]])
  wallThicknessType: number;

  @ApiProperty()
  @IsNumber()
  @Validate(CheckListValidator, ["brickType", [1, 2]])
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
