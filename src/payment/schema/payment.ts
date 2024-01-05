import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Order } from 'src/order/schema/order';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  CANCELED = 'CANCELED',
}

export type PaymentDocument = HydratedDocument<Payment>;

@Schema()
export class Payment {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: Order.name })
  orderId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  status: PaymentStatus;

  @Prop({ required: true })
  yooId: string;

  @Prop({ required: true })
  confirmURL: string;

  @Prop({ required: true, default: false })
  paid: Boolean;

  @Prop({ required: true, type: Date, default: new Date() })
  createdAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
