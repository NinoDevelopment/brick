import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { promises as fs } from "fs";
import * as path from "path";
import sharp from "sharp";
import { unquote } from "../common/unquote";
import { MEDIA_MAX_SIDE, MEDIA_WEBP_QUALITY, MediaEntity } from "./media.constants";

@Injectable()
export class MediaService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  get uploadDir(): string {
    const fromEnv = unquote(this.config.get<string>("UPLOAD_DIR"));
    return fromEnv || path.join(process.cwd(), "uploads");
  }

  get publicBaseUrl(): string {
    const explicit = unquote(this.config.get<string>("PUBLIC_MEDIA_URL"));
    if (explicit) return explicit.replace(/\/$/, "");
    const url = unquote(this.config.get<string>("URL"));
    if (url) {
      const host = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
      return `https://${host}/api/media`;
    }
    return "/media";
  }

  async onModuleInit() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  isHttpUrl(value: string): boolean {
    return value.startsWith("http://") || value.startsWith("https://");
  }

  isDataUri(value: string): boolean {
    return value.startsWith("data:");
  }

  async persistImages(entity: MediaEntity, id: string, images: string[] = []): Promise<string[]> {
    await this.ensureEntityDir(entity, id);
    const result: string[] = [];
    let nextIndex = await this.nextIndex(entity, id);

    for (const image of images) {
      if (!image) continue;
      if (this.isHttpUrl(image)) {
        result.push(image);
        continue;
      }
      if (this.isDataUri(image)) {
        const url = await this.writeImage(entity, id, nextIndex, this.dataUriToBuffer(image));
        nextIndex += 1;
        result.push(url);
      }
    }

    await this.pruneUnused(entity, id, result);
    return result;
  }

  async persistImage(entity: MediaEntity, id: string, image?: string): Promise<string> {
    const [url] = await this.persistImages(entity, id, image ? [image] : []);
    return url ?? "";
  }

  async saveUploadedFiles(
    entity: MediaEntity,
    id: string,
    files: { buffer: Buffer; mimetype?: string }[],
  ): Promise<string[]> {
    if (!files.length) {
      throw new BadRequestException("файлы не переданы");
    }
    await this.ensureEntityDir(entity, id);
    let nextIndex = await this.nextIndex(entity, id);
    const urls: string[] = [];
    for (const file of files) {
      if (file.mimetype && !file.mimetype.startsWith("image/")) {
        throw new BadRequestException("файл не является изображением");
      }
      urls.push(await this.writeImage(entity, id, nextIndex, file.buffer));
      nextIndex += 1;
    }
    return urls;
  }

  async removeEntity(entity: MediaEntity, id: string): Promise<void> {
    await fs.rm(this.entityDir(entity, id), { recursive: true, force: true });
  }

  private entityDir(entity: MediaEntity, id: string): string {
    return path.join(this.uploadDir, entity, id);
  }

  private async ensureEntityDir(entity: MediaEntity, id: string): Promise<void> {
    await fs.mkdir(this.entityDir(entity, id), { recursive: true });
  }

  private publicUrl(entity: MediaEntity, id: string, index: number): string {
    return `${this.publicBaseUrl}/${entity}/${id}/${index}.webp`;
  }

  private async nextIndex(entity: MediaEntity, id: string): Promise<number> {
    const dir = this.entityDir(entity, id);
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return 0;
    }
    let max = -1;
    for (const entry of entries) {
      const match = entry.match(/^(\d+)\.webp$/);
      if (!match) continue;
      max = Math.max(max, Number(match[1]));
    }
    return max + 1;
  }

  private async writeImage(
    entity: MediaEntity,
    id: string,
    index: number,
    buffer: Buffer,
  ): Promise<string> {
    let webp: Buffer;
    try {
      webp = await sharp(buffer)
        .rotate()
        .resize({
          width: MEDIA_MAX_SIDE,
          height: MEDIA_MAX_SIDE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: MEDIA_WEBP_QUALITY })
        .toBuffer();
    } catch {
      throw new BadRequestException("не удалось обработать изображение");
    }
    await fs.writeFile(path.join(this.entityDir(entity, id), `${index}.webp`), webp);
    return this.publicUrl(entity, id, index);
  }

  private dataUriToBuffer(value: string): Buffer {
    const match = value.trim().match(/^data:[^;]+;base64,([a-zA-Z0-9+/=\s]+)$/);
    if (!match) {
      throw new BadRequestException("некорректный data URI");
    }
    return Buffer.from(match[1].replace(/\s+/g, ""), "base64");
  }

  private fileNameFromUrl(url: string): string | null {
    try {
      const parsed = this.isHttpUrl(url) ? new URL(url) : new URL(url, "http://local");
      const base = parsed.pathname.split("/").pop() ?? "";
      return /^\d+\.webp$/.test(base) ? base : null;
    } catch {
      return null;
    }
  }

  private async pruneUnused(entity: MediaEntity, id: string, keptUrls: string[]): Promise<void> {
    const dir = this.entityDir(entity, id);
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return;
    }
    const kept = new Set(
      keptUrls
        .map((url) => this.fileNameFromUrl(url))
        .filter((name): name is string => Boolean(name)),
    );
    await Promise.all(
      entries
        .filter((entry) => /^\d+\.webp$/.test(entry) && !kept.has(entry))
        .map((entry) => fs.unlink(path.join(dir, entry)).catch(() => undefined)),
    );
  }
}
