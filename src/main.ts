import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { urlencoded, json } from "express";
import * as fs from "fs";

async function bootstrap() {
  const key = fs.readFileSync("/etc/nginx/ssl/live/hleb365.ru/privkey.pem");
  const cert = fs.readFileSync("/etc/nginx/ssl/live/hleb365.ru/fullchain.pem");

  const httpsOptions = {
    key: key,
    cert: cert,
  };

  console.log(key);
  console.log(cert);

  const app = await NestFactory.create(AppModule, { httpsOptions, cors: true });

  const config = new DocumentBuilder().setTitle("API").setVersion("1.0").addTag("api").build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(json({ limit: "100mb" }));
  app.use(urlencoded({ extended: true, limit: "100mb" }));
  await app.listen(3000);
}
bootstrap();
