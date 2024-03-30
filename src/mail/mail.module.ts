import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { join } from "path";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service";

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.getOrThrow("MAIL_HOST"),
          port: config.getOrThrow("MAIL_PORT"),
          secure: false,
          secureConnection: false,
          tls: {
            ciphers: "SSLv3",
          },
          auth: {
            user: config.getOrThrow("MAIL_USER"),
            pass: config.getOrThrow("MAIL_PASSWORD"),
          },
        },
        defaults: {
          from: `"No Reply" <${config.getOrThrow("MAIL_FROM")}>`,
        },
        template: {
          dir: join(__dirname, "templates"),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
