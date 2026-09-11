import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as mongoose from "mongoose";

import { CreateItemDto, UpdateItemDto } from "./dto/item.dto";
import { Item, ItemDocument } from "./schema/item";
import { Category } from "../category/schema/category";
import { MediaService } from "../media/media.service";

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly mediaService: MediaService,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    const createdItem = new this.itemModel({ ...createItemDto, images: [] });
    await createdItem.save();
    createdItem.images = await this.mediaService.persistImages(
      "items",
      createdItem._id.toString(),
      createItemDto.images ?? [],
    );
    return createdItem.save();
  }

  async findAll(): Promise<Item[]> {
    return this.itemModel.find().select("-images").exec();
  }

  async findById(id: string): Promise<ItemDocument | null> {
    return this.itemModel.findById(id).select("-images").exec();
  }

  async findByIds(ids: string[]): Promise<ItemDocument[]> {
    if (ids.length === 0) return [];
    return this.itemModel
      .find({ _id: { $in: ids } })
      .select("-images")
      .exec();
  }

  async findByCategoryId(categoryId: string): Promise<Item[]> {
    return this.itemModel.find({ categoryId: categoryId }).select("-images").exec();
  }

  async findRandom(count: number): Promise<Item[]> {
    const size = Math.max(0, Math.trunc(count));
    if (size === 0) return [];
    return this.itemModel.aggregate<Item>([
      { $match: { show: true } },
      { $sample: { size } },
      { $project: { images: 0 } },
    ]);
  }

  async findRecommendations(count: number): Promise<Item[]> {
    const size = Math.max(0, Math.trunc(count));
    if (size === 0) return [];
    return this.itemModel.aggregate<Item>([
      { $match: { isRecommendation: true } },
      { $sample: { size } },
      { $project: { images: 0 } },
    ]);
  }

  async findImages(itemId: string): Promise<{ _id: string; images: string[] }> {
    const item = await this.itemModel.findById(itemId).select("images").exec();
    return { _id: itemId, images: item?.images ?? [] };
  }

  async update(updateItemDto: UpdateItemDto): Promise<Item | null> {
    const item = await this.itemModel.findById(updateItemDto._id);
    if (!item) return null;
    item.name = updateItemDto.name;
    item.description = updateItemDto.description;
    if (updateItemDto.images !== undefined) {
      item.images = await this.mediaService.persistImages(
        "items",
        item._id.toString(),
        updateItemDto.images,
      );
    }
    item.discount = updateItemDto.discount;
    item.pack = updateItemDto.pack;
    item.available = updateItemDto.available;
    item.isRecommendation = updateItemDto.isRecommendation;
    item.show = updateItemDto.show;
    item.price = updateItemDto.price;
    item.color = updateItemDto.color;

    const category = await this.categoryModel.findById(updateItemDto.categoryId).exec();
    if (!category) throw new NotFoundException("категория не найдена");
    item.categoryId = updateItemDto.categoryId;

    return item.save();
  }

  async delete(itemIds: string[]) {
    await Promise.all(itemIds.map((id) => this.mediaService.removeEntity("items", id)));
    await this.itemModel
      .deleteMany({ _id: { $in: itemIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .exec();
    return itemIds;
  }
}
