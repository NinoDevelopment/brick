import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';

import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { Item } from './schema/item';
import { Category } from 'src/category/schema/category';

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    const createdItem = new this.itemModel(createItemDto);
    return createdItem.save();
  }

  async findAll(): Promise<Item[]> {
    return this.itemModel.find().select('-images').exec();
  }

  async findById(id: string): Promise<Item | null> {
    return this.itemModel.findById(id).select('-images').exec();
  }

  async findByCategoryId(categoryId: string): Promise<Item[]> {
    return this.itemModel.find({ categoryId: categoryId }).select('-images').exec();
  }

  async findRandom(count: number): Promise<Item[]> {
    const items = await this.itemModel.find({show: true}).select('-images').exec();
    shuffleArray(items);
    return items.length > count ? items.slice(0, count) : items;
  }

  async findRecommendations(count: number): Promise<Item[]> {
    const items = await this.itemModel.find({ isRecommendation: true }).select('-images').exec();
    shuffleArray(items);
    return items.length > count ? items.slice(0, count) : items;
  }

  async findImages(itemId: string): Promise<string[]> {
    const results = this.itemModel.findOne({ _id: itemId }).select('images').exec();
    if (!results) return [];
    return results as unknown as string[];
  }

  async update(updateItemDto: UpdateItemDto): Promise<Item | null> {
    const item = await this.itemModel.findById(updateItemDto._id);
    if (!item) return null;
    item.name = updateItemDto.name;
    item.description = updateItemDto.description;
    item.images = updateItemDto.images;
    item.discount = updateItemDto.discount;
    item.prices = updateItemDto.prices;
    item.weights = updateItemDto.weights;
    item.composition = updateItemDto.composition;
    item.available = updateItemDto.available;
    item.isRecommendation = updateItemDto.isRecommendation;
    item.show = updateItemDto.show;
    item.onlyBread = updateItemDto.onlyBread;

    const category = await this.categoryModel.findById(updateItemDto.categoryId).exec();
    if (!category) throw new NotFoundException('категория не найдена');
    item.categoryId = updateItemDto.categoryId;

    return item.save();
  }

  async delete(itemIds: string[]) {
    await this.itemModel
      .deleteMany({ _id: { $in: itemIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .exec();
    return itemIds;
  }
}

function shuffleArray<T>(array: Array<T>) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
