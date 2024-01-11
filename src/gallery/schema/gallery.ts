import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Category } from "src/category/schema/category";

export type GalleryCategoryDocument = HydratedDocument<GalleryCategory>;

@Schema()
export class GalleryCategory {
  @Prop({ required: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Category.name })
  categoryId: string;

  @Prop()
  description: string;

  @Prop()
  images: string[];

  @Prop({ default: true })
  show: Boolean;
}

export const GalleryCategorySchema = SchemaFactory.createForClass(GalleryCategory);
