import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { GalleryService } from "./gallery.service";
import {
  CreateCategoryDto,
  DeleteImagesDto,
  FindByCategoryIdParams,
  FindOneParams,
  UpdateCategoryDto,
} from "./dto/gallery.dto";
import { GalleryCategory } from "./schema/gallery";
import { AuthGuard } from "src/auth/auth.guard";

@Controller("gallery")
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  @Get()
  async findAll(): Promise<GalleryCategory[]> {
    return this.galleryService.findAll();
  }

  @Get("category/:categoryId")
  async findByCategoryId(@Param() param: FindByCategoryIdParams): Promise<GalleryCategory[]> {
    return this.galleryService.findByCategoryId(param.categoryId);
  }

  @Get(":id")
  async findOne(@Param() param: FindOneParams): Promise<GalleryCategory> {
    const galleryImage = await this.galleryService.findById(param.id);
    if (galleryImage === null) throw new NotFoundException("изображение не найдено");
    return galleryImage;
  }

  @Get("/images/:id")
  async findImages(@Param() param: FindOneParams): Promise<string[]> {
    return this.galleryService.findImages(param.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createDto: CreateCategoryDto): Promise<GalleryCategory> {
    return this.galleryService.create(createDto);
  }

  @Put()
  @UseGuards(AuthGuard)
  async update(@Body() updateDto: UpdateCategoryDto): Promise<GalleryCategory> {
    const galleryCategory = await this.galleryService.update(updateDto);
    if (!galleryCategory) throw new NotFoundException("категория изображений не найдена");
    return galleryCategory;
  }

  @Delete()
  @UseGuards(AuthGuard)
  async delete(@Body() deleteDto: DeleteImagesDto): Promise<DeleteImagesDto> {
    await this.galleryService.delete(deleteDto.imageIds);
    return deleteDto;
  }
}
