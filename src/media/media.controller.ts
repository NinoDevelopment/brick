import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AuthGuard } from "../auth/auth.guard";
import { UploadMediaDto } from "./dto/upload-media.dto";
import { MEDIA_MAX_FILES, MEDIA_MAX_UPLOAD_BYTES } from "./media.constants";
import { MediaService } from "./media.service";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload")
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FilesInterceptor("files", MEDIA_MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype?.startsWith("image/")) {
          callback(new BadRequestException("файл не является изображением"), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadMediaDto,
  ): Promise<{ urls: string[] }> {
    const urls = await this.mediaService.saveUploadedFiles(body.entity, body.id, files ?? []);
    return { urls };
  }
}
