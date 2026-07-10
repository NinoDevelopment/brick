import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { join } from "path";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service";

function unquote(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const host = unquote(config.getOrThrow("MAIL_HOST"));
        const user = unquote(config.getOrThrow("MAIL_USER"));
        const pass = unquote(config.getOrThrow("MAIL_PASSWORD"));
        const from = unquote(config.getOrThrow("MAIL_FROM"));
        const port = Number(unquote(String(config.getOrThrow("MAIL_PORT"))));

        return {
          transport: {
            host,
            port,
            secure: port === 465,
            requireTLS: port === 587,
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 15000,
            auth: { user, pass },
            tls: {
              minVersion: "TLSv1.2",
              rejectUnauthorized: true,
            },
          },
          defaults: {
            from: `"KZK" <${from}>`,
          },
          template: {
            dir: join(__dirname, "templates"),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
