import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Item } from "../../item/schema/item";

export type OrderPositionDocument = HydratedDocument<OrderPosition>;

export type PromocodeDocument = HydratedDocument<Promocode>;

@Schema()
export class Promocode {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  skidka: number;
}

export const PromocodeSchema = SchemaFactory.createForClass(Promocode);

@Schema()
export class SchetInfo {
  @Prop({ required: true })
  companyName: string;
  @Prop({ required: true })
  companyAddress: string;
  @Prop({ required: true })
  inn: string;
  @Prop()
  kpp?: string;
}

@Schema()
export class OrderPosition {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Item.name })
  itemId: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  pack: number;
}

export enum DeliveryType {
  SELF = "SELF",
  COURIER = "COURIER",
}

export enum PaymentType {
  CASH = "CASH",
  ONLINE = "ONLINE",
  SCHET = "SCHET",
}

export type AddressDocument = HydratedDocument<Address>;

@Schema()
export class Address {
  @Prop()
  address: string;

  @Prop()
  addressName?: string;

  @Prop()
  city: string;

  @Prop()
  flat?: string;

  @Prop()
  entrance?: string;

  @Prop()
  intercom?: string;

  @Prop()
  floor?: number;

  @Prop()
  commentAddress?: string;
}

export type OrderDocument = HydratedDocument<Order>;

@Schema()
export class Order {
  @Prop({ unique: true })
  orderId: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop()
  email: string;

  @Prop({ required: true })
  fullName: string;

  @Prop()
  address: Address;

  @Prop()
  shopAddress: string;

  @Prop({ required: true, default: false })
  completed: boolean;

  @Prop({ required: true })
  positions: OrderPosition[];

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, type: Date, default: () => new Date() })
  createdAt: Date;

  @Prop()
  comment?: string;

  @Prop({ required: true })
  deliveryType: DeliveryType;

  @Prop()
  paid: boolean;

  @Prop()
  paymentType: PaymentType;

  @Prop()
  promocode?: string;

  @Prop()
  schetInfo?: SchetInfo;
}
export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ createdAt: -1 });
