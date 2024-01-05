import { IsNotEmpty, IsString, IsMongoId, IsOptional, IsBoolean } from "class-validator";

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  image: string;

  @IsOptional()
  @IsBoolean()
  hasSale: Boolean;
}

export class UpdateCategoryDto extends CreateCategoryDto {
  @IsMongoId()
  _id: string;
}

export class DeleteCategoriesDto {
  @IsMongoId({ each: true })
  categoryIds: string[];
}

export class FindOneParams {
  @IsMongoId()
  id: string;
}
