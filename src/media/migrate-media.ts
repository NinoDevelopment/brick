import { NestFactory } from "@nestjs/core";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppModule } from "../app.module";
import { Category } from "../category/schema/category";
import { Project } from "../gallery/schema/gallery";
import { Item } from "../item/schema/item";
import { MediaService } from "./media.service";

type ImageDoc = {
  _id: { toString(): string };
  images?: string[];
  image?: string;
  save: () => Promise<unknown>;
};

const isDataUri = (value: string) => value.startsWith("data:");

async function migrateImages(
  label: string,
  docs: ImageDoc[],
  persist: (id: string, images: string[]) => Promise<string[]>,
  read: (doc: ImageDoc) => string[],
  write: (doc: ImageDoc, urls: string[]) => void,
) {
  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    const current = read(doc).filter(Boolean);
    if (!current.some(isDataUri)) {
      skipped += 1;
      continue;
    }
    try {
      const urls = await persist(doc._id.toString(), current);
      write(doc, urls);
      await doc.save();
      converted += 1;
    } catch (error) {
      failed += 1;
      console.error(`[${label}] ${doc._id.toString()}`, error);
    }
  }

  console.log(`${label}: converted=${converted} skipped=${skipped} failed=${failed}`);
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const media = app.get(MediaService);
    const items = app.get<Model<Item>>(getModelToken(Item.name));
    const projects = app.get<Model<Project>>(getModelToken(Project.name));
    const categories = app.get<Model<Category>>(getModelToken(Category.name));

    await migrateImages(
      "items",
      (await items.find().exec()) as unknown as ImageDoc[],
      (id, images) => media.persistImages("items", id, images),
      (doc) => doc.images ?? [],
      (doc, urls) => {
        doc.images = urls;
      },
    );

    await migrateImages(
      "gallery",
      (await projects.find().exec()) as unknown as ImageDoc[],
      (id, images) => media.persistImages("gallery", id, images),
      (doc) => doc.images ?? [],
      (doc, urls) => {
        doc.images = urls;
      },
    );

    await migrateImages(
      "categories",
      (await categories.find().exec()) as unknown as ImageDoc[],
      (id, images) => media.persistImages("categories", id, images),
      (doc) => (doc.image ? [doc.image] : []),
      (doc, urls) => {
        doc.image = urls[0] ?? "";
      },
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
