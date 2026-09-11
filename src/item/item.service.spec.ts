import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { ItemService } from "./item.service";
import { Item } from "./schema/item";
import { Category } from "../category/schema/category";
import { MediaService } from "../media/media.service";

describe("ItemService", () => {
  let service: ItemService;
  const itemModel = {
    findById: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn(),
  };
  const categoryModel = {};
  const mediaService = {
    persistImages: jest.fn(),
    persistImage: jest.fn(),
    removeEntity: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ItemService,
        { provide: getModelToken(Item.name), useValue: itemModel },
        { provide: getModelToken(Category.name), useValue: categoryModel },
        { provide: MediaService, useValue: mediaService },
      ],
    }).compile();

    service = module.get(ItemService);
    jest.clearAllMocks();
  });

  it("findImages returns images array", async () => {
    itemModel.findById.mockReturnValue({
      select: () => ({
        exec: jest.fn().mockResolvedValue({ images: ["a", "b"] }),
      }),
    });
    await expect(service.findImages("id")).resolves.toEqual({ _id: "id", images: ["a", "b"] });
  });

  it("findImages returns empty array when item is missing", async () => {
    itemModel.findById.mockReturnValue({
      select: () => ({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });
    await expect(service.findImages("id")).resolves.toEqual({ _id: "id", images: [] });
  });
});
