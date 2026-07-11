import { IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  images: string[];

  @IsBoolean()
  show: boolean;
}

export class UpdateProjectDto extends CreateProjectDto {
  @IsMongoId()
  _id: string;
}

export class DeleteProjectsDto {
  @IsMongoId({ each: true })
  projectIds: string[];
}

export class FindOneParams {
  @IsMongoId()
  id: string;
}
