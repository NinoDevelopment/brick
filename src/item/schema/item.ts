import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Category } from "src/category/schema/category";

export type PriceDocument = HydratedDocument<Price>;

@Schema()
export class Price {
  @Prop({ required: true })
  weight: number;

  @Prop({ required: true })
  price: number;
}

export const PriceSchema = SchemaFactory.createForClass(Price);

export type WeightDocument = HydratedDocument<Weight>;

@Schema({ toJSON: { virtuals: true, getters: true } })
export class Weight {
  @Prop({ required: true })
  value: number;
  title?: string;
}
const WeightSchema = SchemaFactory.createForClass(Weight);

WeightSchema.virtual("title").get(function (this: WeightDocument) {
  return `${this.value} грамм`;
});

export { WeightSchema };

export type ItemDocument = HydratedDocument<Item>;

@Schema()
export class Item {
  @Prop({ required: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Category.name })
  categoryId: string;

  @Prop()
  description: string;

  @Prop()
  images: string[];

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  prices: Price[];

  @Prop({ required: true })
  weights: Weight[];

  @Prop()
  composition: string;

  @Prop({ required: true })
  available: Boolean;

  @Prop({ default: false })
  isRecommendation: Boolean;

  @Prop({ default: true })
  show: Boolean;

  @Prop({ default: false })
  onlyBread: Boolean;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
