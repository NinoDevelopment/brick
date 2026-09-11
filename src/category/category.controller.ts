import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Put,
  UseGuards,
} from "@nestjs/common";

import {
  CreateCategoryDto,
  DeleteCategoriesDto,
  FindOneParams,
  UpdateCategoryDto,
} from "./dto/category.dto";
import { CategoryService } from "./category.service";
import { Category } from "./schema/category";
import { AuthGuard } from "src/auth/auth.guard";

@Controller("category")
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(":id")
  async findOne(@Param() param: FindOneParams): Promise<Category> {
    const category = await this.categoryService.findById(param.id);
    if (!category) throw new NotFoundException("категория не найдена");
    return category;
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createDto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.create(createDto);
  }

  @Put()
  @UseGuards(AuthGuard)
  async update(@Body() updateDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryService.update(updateDto);
    if (!category) throw new NotFoundException("категория не найдена");
    return category;
  }

  @Delete()
  @UseGuards(AuthGuard)
  async delete(@Body() dto: DeleteCategoriesDto): Promise<DeleteCategoriesDto> {
    await this.categoryService.delete(dto.categoryIds);
    return dto;
  }
}
