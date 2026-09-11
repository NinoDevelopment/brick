import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { MediaService } from "./media.service";

const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const DATA_URI = `data:image/png;base64,${PNG_1x1.toString("base64")}`;

describe("MediaService", () => {
  let service: MediaService;
  let uploadDir: string;

  beforeEach(async () => {
    uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), "brick-media-"));
    const module = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === "UPLOAD_DIR") return uploadDir;
              if (key === "PUBLIC_MEDIA_URL") return "https://kzk.ooo/api/media";
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get(MediaService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await fs.rm(uploadDir, { recursive: true, force: true });
  });

  it("converts data URI to webp file and public URL", async () => {
    const urls = await service.persistImages("items", "abc123", [DATA_URI]);
    expect(urls).toEqual(["https://kzk.ooo/api/media/items/abc123/0.webp"]);
    await expect(
      fs.access(path.join(uploadDir, "items", "abc123", "0.webp")),
    ).resolves.toBeUndefined();
  });

  it("keeps existing http URLs and is idempotent", async () => {
    const first = await service.persistImages("items", "abc123", [DATA_URI]);
    const second = await service.persistImages("items", "abc123", first);
    expect(second).toEqual(first);
    const files = await fs.readdir(path.join(uploadDir, "items", "abc123"));
    expect(files).toEqual(["0.webp"]);
  });

  it("prunes files that are no longer referenced", async () => {
    const urls = await service.persistImages("gallery", "proj1", [DATA_URI, DATA_URI]);
    expect(urls).toHaveLength(2);
    const kept = await service.persistImages("gallery", "proj1", [urls[1]]);
    expect(kept).toEqual([urls[1]]);
    const files = await fs.readdir(path.join(uploadDir, "gallery", "proj1"));
    expect(files).toEqual(["1.webp"]);
  });

  it("writes uploaded buffers and removes entity directory", async () => {
    const urls = await service.saveUploadedFiles("categories", "cat1", [
      { buffer: PNG_1x1, mimetype: "image/png" },
    ]);
    expect(urls[0]).toBe("https://kzk.ooo/api/media/categories/cat1/0.webp");
    await service.removeEntity("categories", "cat1");
    await expect(fs.access(path.join(uploadDir, "categories", "cat1"))).rejects.toThrow();
  });
});
