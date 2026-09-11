import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as path from "path";
import { AuthModule } from "../auth/auth.module";
import { unquote } from "../common/unquote";
import { MEDIA_CACHE_CONTROL } from "./media.constants";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";

const resolveUploadDir = (config: ConfigService) =>
  unquote(config.get<string>("UPLOAD_DIR")) || path.join(process.cwd(), "uploads");

@Module({
  imports: [
    AuthModule,
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: resolveUploadDir(config),
          serveRoot: "/media",
          serveStaticOptions: {
            index: false,
            fallthrough: true,
            setHeaders: (res) => {
              res.setHeader("Cache-Control", MEDIA_CACHE_CONTROL);
            },
          },
        },
      ],
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
