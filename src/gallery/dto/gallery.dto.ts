import { IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateGalleryImageDto {
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

  @IsBoolean()
  show: Boolean;
}

export class UpdateGalleryImageDto extends CreateGalleryImageDto {
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

export class DeleteGalleryImagesDto {
  @IsMongoId({ each: true })
  galleryImageIds: string[];
}
