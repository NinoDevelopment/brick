import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as mongoose from "mongoose";

import { CreateGalleryImageDto, UpdateGalleryImageDto } from "./dto/gallery.dto";
import { GalleryImage } from "./schema/gallery";
import { Category } from "src/category/schema/category";

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(GalleryImage.name) private galleryImageModel: Model<GalleryImage>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(createGalleryImageDto: CreateGalleryImageDto): Promise<GalleryImage> {
    const createdGalleryImage = new this.galleryImageModel(createGalleryImageDto);
    return createdGalleryImage.save();
  }

  async findAll(): Promise<GalleryImage[]> {
    return this.galleryImageModel.find().select("-images").exec();
  }

  async findById(id: string): Promise<GalleryImage | null> {
    return this.galleryImageModel.findById(id).select("-images").exec();
  }

  async findByCategoryId(categoryId: string): Promise<GalleryImage[]> {
    return this.galleryImageModel.find({ categoryId: categoryId }).select("-images").exec();
  }

  async findImages(galleryImageId: string): Promise<string[]> {
    const results = this.galleryImageModel.findOne({ _id: galleryImageId }).select("images").exec();
    if (!results) return [];
    return results as unknown as string[];
  }

  async update(updateGalleryImageDto: UpdateGalleryImageDto): Promise<GalleryImage | null> {
    const galleryImage = await this.galleryImageModel.findById(updateGalleryImageDto._id);
    if (!galleryImage) return null;
    galleryImage.name = updateGalleryImageDto.name;
    galleryImage.description = updateGalleryImageDto.description;
    galleryImage.images = updateGalleryImageDto.images;
    galleryImage.show = updateGalleryImageDto.show;

    const category = await this.categoryModel.findById(updateGalleryImageDto.categoryId).exec();
    if (!category) throw new NotFoundException("категория не найдена");
    galleryImage.categoryId = updateGalleryImageDto.categoryId;

    return galleryImage.save();
  }

  async delete(galleryImageIds: string[]) {
    await this.galleryImageModel
      .deleteMany({ _id: { $in: galleryImageIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .exec();
    return galleryImageIds;
  }
}
