import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";
import { promises as fs } from "fs";
import { join } from "path";
import Handlebars from "handlebars";
import { unquote } from "../common/unquote";

export interface SendTemplatedMail {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, unknown>;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}

@Injectable()
export class SmtpMailer {
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly templatesDir = join(__dirname, "templates");

  constructor(config: ConfigService) {
    const host = unquote(config.getOrThrow("MAIL_HOST"));
    const user = unquote(config.getOrThrow("MAIL_USER"));
    const pass = unquote(config.getOrThrow("MAIL_PASSWORD"));
    const from = unquote(config.getOrThrow("MAIL_FROM"));
    const port = Number(unquote(String(config.getOrThrow("MAIL_PORT"))));

    this.from = `"KZK" <${from}>`;
    this.transporter = createTransport({
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
    });
  }

  async sendMail(options: SendTemplatedMail): Promise<void> {
    const templateName = options.template.replace(/^\.\//, "");
    const source = await fs.readFile(join(this.templatesDir, `${templateName}.hbs`), "utf8");
    const html = Handlebars.compile(source, { strict: true })(options.context);

    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html,
      attachments: options.attachments,
    });
  }
}
