import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Item } from "src/item/schema/item";

export type OrderPositionDocument = HydratedDocument<OrderPosition>;

@Schema()
export class OrderPosition {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Item.name })
  itemId: string;

  @Prop({ required: true })
  weight: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;
}

export enum DeliveryType {
  SELF = "SELF",
  COURIER = "COURIER",
}

export enum PaymentType {
  CASH = "CASH",
  ONLINE = "ONLINE",
}

export type AddressDocument = HydratedDocument<Address>;

@Schema()
export class Address {
  @Prop()
  address: string;

  @Prop()
  addressName?: string;

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
  @Prop({ required: true })
  phoneNumber: string;

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

  @Prop({ required: true, type: Date, default: new Date() })
  createdAt: Date;

  @Prop()
  comment?: string;

  @Prop({ required: true })
  deliveryType: DeliveryType;

  @Prop()
  paid: boolean;

  @Prop()
  paymentType: PaymentType;
}
export const OrderSchema = SchemaFactory.createForClass(Order);
