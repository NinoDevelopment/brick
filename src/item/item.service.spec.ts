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

  it("findAll returns items with images instead of N+1 /images/:id lookups", async () => {
    const items = [{ _id: "1", name: "brick", images: ["https://cdn/a.webp"] }];
    const query = { select: jest.fn(), exec: jest.fn().mockResolvedValue(items) };
    itemModel.find.mockReturnValue(query);

    await expect(service.findAll()).resolves.toEqual(items);
    expect(query.select).not.toHaveBeenCalled();
  });

  it("findById returns images with the item", async () => {
    const item = { _id: "id", images: ["https://cdn/a.webp"] };
    const query = { select: jest.fn(), exec: jest.fn().mockResolvedValue(item) };
    itemModel.findById.mockReturnValue(query);

    await expect(service.findById("id")).resolves.toEqual(item);
    expect(query.select).not.toHaveBeenCalled();
  });

  it("findByCategoryId returns images with items", async () => {
    const items = [{ _id: "1", categoryId: "c", images: ["https://cdn/a.webp"] }];
    const query = { select: jest.fn(), exec: jest.fn().mockResolvedValue(items) };
    itemModel.find.mockReturnValue(query);

    await expect(service.findByCategoryId("c")).resolves.toEqual(items);
    expect(itemModel.find).toHaveBeenCalledWith({ categoryId: "c" });
    expect(query.select).not.toHaveBeenCalled();
  });

  it("findRandom does not strip images", async () => {
    itemModel.aggregate.mockResolvedValue([{ images: ["https://cdn/a.webp"] }]);
    await service.findRandom(2);
    expect(itemModel.aggregate).toHaveBeenCalledWith([
      { $match: { show: true } },
      { $sample: { size: 2 } },
    ]);
  });

  it("findRecommendations does not strip images", async () => {
    itemModel.aggregate.mockResolvedValue([{ images: ["https://cdn/a.webp"] }]);
    await service.findRecommendations(1);
    expect(itemModel.aggregate).toHaveBeenCalledWith([
      { $match: { isRecommendation: true } },
      { $sample: { size: 1 } },
    ]);
  });
});
