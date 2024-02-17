import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsEmail,
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
} from "class-validator";
import { DeliveryType, PaymentType } from "../schema/order";
import { ApiProperty } from "@nestjs/swagger";

export class CallMeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class OrderPositionDto {
  @ApiProperty()
  @IsMongoId()
  itemId: string;

  @ApiProperty()
  @IsPositive()
  price: number;

  @ApiProperty()
  @IsPositive()
  quantity: number;
}

export class AddressInfo {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Max(300)
  address: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Max(300)
  addressName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Max(300)
  flat?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Max(300)
  entrance?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Max(300)
  intercom?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Max(1500)
  commentAddress?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
  phoneNumber: string;

  @ApiProperty()
  @ValidateIf((o: CreateOrderDto) => o.paymentType === PaymentType.SCHET)
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @ValidateIf((o: CreateOrderDto) => o.deliveryType === DeliveryType.COURIER)
  @IsNotEmptyObject()
  @ValidateNested()
  address: AddressInfo;

  @ApiProperty()
  @ValidateIf((o: CreateOrderDto) => o.deliveryType === DeliveryType.SELF)
  @IsString()
  @IsNotEmpty()
  shopAddress: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested()
  positions: OrderPositionDto[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  comment: string;

  @ApiProperty()
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  promocode: string;

  @ApiProperty()
  @ValidateIf((o: CreateOrderDto) => o.paymentType === PaymentType.SCHET)
  @ValidateNested()
  schetInfo?: SchetInfoDto;
}

export class SchetInfoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankName: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bic: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  correspondentAccount: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  receiverAccount: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  inn: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  kpp: string;
}

export class FindOneParams {
  @ApiProperty()
  @IsMongoId()
  id: string;
}

export class OrderAmountDto {
  @ApiProperty()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsPositive()
  discountedAmount: number;

  @ApiProperty()
  @IsPositive()
  amountWithDelivery: number;
}

export class CalculateOrderAmountRequest {
  @ApiProperty()
  @IsArray()
  @ValidateNested()
  positions: OrderPositionDto[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  promocode: string;
}

export class CreatePromocodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  skidka: number;
}