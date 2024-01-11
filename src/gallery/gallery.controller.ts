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
  CreateGalleryImageDto,
  DeleteGalleryImagesDto,
  FindByCategoryIdParams,
  FindOneParams,
  UpdateGalleryImageDto,
} from "./dto/gallery.dto";
import { GalleryImage } from "./schema/gallery";
import { AuthGuard } from "src/auth/auth.guard";

@Controller("gallery")
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  @Get()
  async findAll(): Promise<GalleryImage[]> {
    return this.galleryService.findAll();
  }

  @Get("category/:categoryId")
  async findByCategoryId(@Param() param: FindByCategoryIdParams): Promise<GalleryImage[]> {
    return this.galleryService.findByCategoryId(param.categoryId);
  }

  @Get(":id")
  async findOne(@Param() param: FindOneParams): Promise<GalleryImage> {
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
  async create(@Body() createDto: CreateGalleryImageDto): Promise<GalleryImage> {
    return this.galleryService.create(createDto);
  }

  @Put()
  @UseGuards(AuthGuard)
  async update(@Body() updateDto: UpdateGalleryImageDto): Promise<GalleryImage> {
    const galleryImage = await this.galleryService.update(updateDto);
    if (!galleryImage) throw new NotFoundException("изображение не найдено");
    return galleryImage;
  }

  @Delete()
  @UseGuards(AuthGuard)
  async delete(@Body() dto: DeleteGalleryImagesDto): Promise<DeleteGalleryImagesDto> {
    await this.galleryService.delete(dto.galleryImageIds);
    return dto;
  }
}
