import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DeliveryType, PaymentType } from '../schema/order';

export class OrderPositionDto {
  @IsMongoId()
  itemId: string;

  @IsPositive()
  price: number;

  @IsPositive()
  weight: number;

  @IsPositive()
  quantity: number;
}

export class AddressInfo {
  @IsString()
  @IsNotEmpty()
  @Max(300)
  address: string;

  @IsOptional()
  @IsString()
  @Max(300)
  addressName?: string;

  @IsOptional()
  @IsString()
  @Max(300)
  flat?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Max(300)
  entrance?: string;

  @IsOptional()
  @IsString()
  @Max(300)
  intercom?: string;

  @IsOptional()
  @IsNumber()
  floor?: number;

  @IsOptional()
  @IsString()
  @Max(1500)
  commentAddress?: string;
}

export class CreateOrderDto {
  @IsString()
  @Matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ValidateIf((o: CreateOrderDto) => o.deliveryType === DeliveryType.COURIER)
  @IsNotEmptyObject()
  @ValidateNested()
  address: AddressInfo;

  @ValidateIf((o: CreateOrderDto) => o.deliveryType === DeliveryType.SELF)
  @IsString()
  @IsNotEmpty()
  shopAddress: string;

  @ArrayNotEmpty()
  @ValidateNested()
  positions: OrderPositionDto[];

  @IsOptional()
  @IsString()
  comment: string;

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @IsEnum(PaymentType)
  paymentType: PaymentType;
}

export class FindOneParams {
  @IsMongoId()
  id: string;
}

export class OrderAmountDto {
  @IsPositive()
  amount: number;

  @IsPositive()
  discountedAmount: number;

  @IsPositive()
  amountWithDelivery: number;
}

export class CalculateOrderAmountRequest {
  @IsArray()
  @ValidateNested()
  positions: OrderPositionDto[];
}
