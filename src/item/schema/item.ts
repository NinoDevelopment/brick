import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Category } from "../../category/schema/category";

export type ItemDocument = HydratedDocument<Item>;

@Schema()
export class Item {
  @Prop({ required: true })
  name: string;

  @Prop()
  color: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Category.name })
  categoryId: string;

  @Prop()
  description: string;

  @Prop()
  images: string[];

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 400 })
  pack: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  available: boolean;

  @Prop({ default: false })
  isRecommendation: boolean;

  @Prop({ default: true })
  show: boolean;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
