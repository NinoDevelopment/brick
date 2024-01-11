import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as mongoose from "mongoose";

import { CreateCategoryDto, UpdateCategoryDto } from "./dto/gallery.dto";
import { GalleryCategory } from "./schema/gallery";
import { Category } from "src/category/schema/category";

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(GalleryCategory.name) private galleryCategoryModel: Model<GalleryCategory>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<GalleryCategory> {
    const createdCategory = new this.galleryCategoryModel(createCategoryDto);
    return createdCategory.save();
  }

  async findAll(): Promise<GalleryCategory[]> {
    return this.galleryCategoryModel.find().select("-images").exec();
  }

  async findById(id: string): Promise<GalleryCategory | null> {
    return this.galleryCategoryModel.findById(id).select("-images").exec();
  }

  async findByCategoryId(categoryId: string): Promise<GalleryCategory[]> {
    return this.galleryCategoryModel.find({ categoryId: categoryId }).select("-images").exec();
  }

  async findImages(galleryImageId: string): Promise<string[]> {
    const results = this.galleryCategoryModel
      .findOne({ _id: galleryImageId })
      .select("images")
      .exec();
    if (!results) return [];
    return results as unknown as string[];
  }

  async update(updateCategoryDto: UpdateCategoryDto): Promise<GalleryCategory | null> {
    const galleryCategory = await this.galleryCategoryModel.findById(updateCategoryDto._id);
    if (!galleryCategory) return null;
    galleryCategory.name = updateCategoryDto.name;
    galleryCategory.description = updateCategoryDto.description;
    galleryCategory.images = updateCategoryDto.images;
    galleryCategory.show = updateCategoryDto.show;

    const category = await this.categoryModel.findById(updateCategoryDto.categoryId).exec();
    if (!category) throw new NotFoundException("категория не найдена");
    galleryCategory.categoryId = updateCategoryDto.categoryId;

    return galleryCategory.save();
  }

  async delete(galleryImageIds: string[]) {
    await this.galleryCategoryModel
      .deleteMany({ _id: { $in: galleryImageIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .exec();
    return galleryImageIds;
  }
}
