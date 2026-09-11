import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

import { Category } from "./schema/category";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { MediaService } from "../media/media.service";

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly mediaService: MediaService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const createdCategory = new this.categoryModel({ ...createCategoryDto, image: "" });
    await createdCategory.save();
    createdCategory.image = await this.mediaService.persistImage(
      "categories",
      createdCategory._id.toString(),
      createCategoryDto.image,
    );
    return createdCategory.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoryModel.findById(id).exec();
  }

  async delete(categoryIds: string[]) {
    await Promise.all(categoryIds.map((id) => this.mediaService.removeEntity("categories", id)));
    await this.categoryModel
      .deleteMany({ _id: { $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .exec();
    return categoryIds;
  }

  async update(updateDto: UpdateCategoryDto): Promise<Category | null> {
    const category = await this.categoryModel.findById(updateDto._id).exec();
    if (!category) return null;
    category.name = updateDto.name;
    category.description = updateDto.description;
    if (updateDto.image !== undefined) {
      category.image = await this.mediaService.persistImage(
        "categories",
        category._id.toString(),
        updateDto.image,
      );
    }
    category.hasSale = updateDto.hasSale;
    return category.save();
  }
}
