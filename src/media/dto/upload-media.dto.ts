import { IsIn, IsMongoId } from "class-validator";
import { MEDIA_ENTITIES, MediaEntity } from "../media.constants";

export class UploadMediaDto {
  @IsIn(MEDIA_ENTITIES)
  entity: MediaEntity;

  @IsMongoId()
  id: string;
}
