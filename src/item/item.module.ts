import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemController } from "./item.controller";
import { ItemService } from "./item.service";
import { Item, ItemSchema } from "./schema/item";
import { AuthModule } from "../auth/auth.module";
import { CategoryModule } from "../category/category.module";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [
    AuthModule,
    MediaModule,
    CategoryModule,
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
  ],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService, MongooseModule],
})
export class ItemModule {}
