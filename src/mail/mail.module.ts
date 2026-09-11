import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MailService } from "./mail.service";
import { SmtpMailer } from "./smtp-mailer";

@Module({
  imports: [ConfigModule],
  providers: [SmtpMailer, MailService],
  exports: [MailService],
})
export class MailModule {}
