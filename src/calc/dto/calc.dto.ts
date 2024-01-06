import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsPositive } from "class-validator";

export class CalculateBrickQuantityByVolumeDto {
  @ApiProperty()
  @IsNumber()
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
  wallThicknessType: number;

  @ApiProperty()
  @IsNumber()
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
