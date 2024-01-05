import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose'

import { Category } from './schema/category';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';


@Injectable()
export class CategoryService {
    constructor(@InjectModel(Category.name) private categoryModel: Model<Category>) { }

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        const createdCategory = new this.categoryModel(createCategoryDto);
        return createdCategory.save();
    }

    async findAll(): Promise<Category[]> {
        return this.categoryModel.find().exec();
    }

    async findById(id: string): Promise<Category | null> {
        return this.categoryModel.findById(id).exec();
    }

    async delete(categoryIds: string[]) {
        await this.categoryModel
            .deleteMany({ _id: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) } }).exec();
        return categoryIds;
    }

    async update(updateDto: UpdateCategoryDto): Promise<Category | null> {
        const category = await this.categoryModel.findById(updateDto._id).exec();
        if (!category) return null;
        category.name = updateDto.name;
        category.description = updateDto.description;
        category.image = updateDto.image;
        category.hasSale = updateDto.hasSale;
        return category.save();
    }
}

