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

  @Min(0)
  pack: number;

  @IsPositive()
  price: number;

  @IsBoolean()
  available: boolean;

  @IsString()
  color: string;

  @IsBoolean()
  isRecommendation: boolean;

  @IsBoolean()
  show: boolean;
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
