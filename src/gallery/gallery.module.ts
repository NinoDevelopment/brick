import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GalleryController } from "./gallery.controller";
import { GalleryService } from "./gallery.service";
import { Project, ProjectSchema } from "./schema/gallery";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [
    AuthModule,
    MediaModule,
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
