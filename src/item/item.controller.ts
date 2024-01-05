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
import { ItemService } from "./item.service";
import {
  CreateItemDto,
  DeleteItemsDto,
  FindByCategoryIdParams,
  FindOneParams,
  FindSampleParams,
  UpdateItemDto,
} from "./dto/item.dto";
import { Item } from "./schema/item";
import { AuthGuard } from "src/auth/auth.guard";

@Controller("item")
export class ItemController {
  constructor(private itemService: ItemService) {}

  @Get()
  async findAll(): Promise<Item[]> {
    return this.itemService.findAll();
  }

  @Get("category/:categoryId")
  async findByCategoryId(@Param() param: FindByCategoryIdParams): Promise<Item[]> {
    return this.itemService.findByCategoryId(param.categoryId);
  }

  @Get(":id")
  async findOne(@Param() param: FindOneParams): Promise<Item> {
    const item = await this.itemService.findById(param.id);
    if (item === null) throw new NotFoundException("товар не найден");
    return item;
  }

  @Get("sample/:size")
  async findSample(@Param() params: FindSampleParams): Promise<Item[]> {
    return this.itemService.findRandom(parseInt(params.size));
  }

  @Get("recommendations/:size")
  async findRecommendations(@Param() params: FindSampleParams): Promise<Item[]> {
    return this.itemService.findRecommendations(parseInt(params.size));
  }

  @Get("/images/:id")
  async findImages(@Param() param: FindOneParams): Promise<string[]> {
    return this.itemService.findImages(param.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createDto: CreateItemDto): Promise<Item> {
    return this.itemService.create(createDto);
  }

  @Put()
  @UseGuards(AuthGuard)
  async update(@Body() updateDto: UpdateItemDto): Promise<Item> {
    const item = await this.itemService.update(updateDto);
    if (!item) throw new NotFoundException("товар не найден");
    return item;
  }

  @Delete()
  @UseGuards(AuthGuard)
  async delete(@Body() dto: DeleteItemsDto): Promise<DeleteItemsDto> {
    await this.itemService.delete(dto.itemIds);
    return dto;
  }
}
