import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class PriceDto {
  @IsPositive()
  price: number;

  @IsPositive()
  weight: number;
}

export class WeightDto {
  @IsPositive()
  value: number;

  @IsOptional()
  @IsString()
  title: string;
}

export class CreateItemDto {
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  categoryId: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  images: string[];

  @IsOptional()
  @Min(0)
  discount: number;

  @ArrayNotEmpty()
  @ValidateNested()
  prices: PriceDto[];

  @ArrayNotEmpty()
  @ValidateNested()
  weights: WeightDto[];

  @IsOptional()
  @IsString()
  composition: string;

  @IsBoolean()
  available: Boolean;

  @IsBoolean()
  isRecommendation: Boolean;

  @IsBoolean()
  show: Boolean;

  @IsBoolean()
  onlyBread: Boolean;
}

export class UpdateItemDto extends CreateItemDto {
  @IsMongoId()
  _id: string;
}

export class FindByCategoryIdParams {
  @IsMongoId()
  categoryId: string;
}

export class FindOneParams {
  @IsMongoId()
  id: string;
}

export class FindSampleParams {
  @IsNumberString({ no_symbols: true })
  size: string;
}

export class DeleteItemsDto {
  @IsMongoId({ each: true })
  itemIds: string[];
}
