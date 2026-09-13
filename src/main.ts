import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { json, urlencoded } from "express";
import helmet from "helmet";
import { unquote } from "./common/unquote";

function resolveCorsOrigin(): string | string[] | boolean {
  const fromEnv = unquote(process.env["CORS_ORIGIN"]);
  if (fromEnv) {
    const origins = fromEnv
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    return origins.length === 1 ? origins[0] : origins;
  }
  const url = unquote(process.env["URL"]);
  return url ? `https://${url}` : false;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: resolveCorsOrigin(),
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const config = new DocumentBuilder().setTitle("API").setVersion("1.0").addTag("api").build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(json({ limit: "20mb" }));
  app.use(urlencoded({ extended: true, limit: "20mb" }));
  await app.listen(8080);
}
bootstrap().catch(console.log);
