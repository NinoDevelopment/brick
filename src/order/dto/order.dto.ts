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
import { Type } from "class-transformer";
import { DeliveryType, PaymentType } from "../schema/order";
import { ApiProperty } from "@nestjs/swagger";

export class SchetInfoDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  companyAddress?: string;

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

export class LookupInnDto {
  @ApiProperty()
  @IsString()
  @Matches(/^\d{10}(\d{2})?$/, {
    message: "ИНН должен содержать 10 или 12 цифр",
  })
  inn: string;
}

export class CompanyByInnDto {
  @ApiProperty()
  inn: string;

  @ApiProperty()
  kpp: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  companyAddress: string;
}

export class CallMeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{1,3}\([0-9]{3}\)[0-9]{3}-[0-9]{2}-[0-9]{2}$/, {
    message: "телефон должен быть в формате +7(XXX)XXX-XX-XX",
  })
  phoneNumber: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  companyName?: string;

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

  @ApiProperty({ required: false, deprecated: true })
  @IsOptional()
  @IsPositive()
  price?: number;

  @ApiProperty()
  @IsPositive()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsPositive()
  pack?: number;
}

export class OrderStatusAddressDto {
  @ApiProperty()
  city: string;

  @ApiProperty()
  address: string;
}

export class OrderStatusPositionDto {
  @ApiProperty()
  itemId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  pack: number;
}

export class OrderStatusDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  paid: boolean;

  @ApiProperty()
  completed: boolean;

  @ApiProperty({ enum: PaymentType })
  paymentType: PaymentType;

  @ApiProperty({ enum: DeliveryType })
  deliveryType: DeliveryType;

  @ApiProperty({ required: false })
  shopAddress?: string;

  @ApiProperty({ required: false, type: OrderStatusAddressDto })
  address?: OrderStatusAddressDto;

  @ApiProperty({ type: [OrderStatusPositionDto] })
  positions: OrderStatusPositionDto[];

  @ApiProperty()
  createdAt: Date;
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
  @IsNotEmpty()
  @IsString()
  @Max(300)
  city: string;

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
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty()
  @IsString()
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
  @Type(() => AddressInfo)
  address: AddressInfo;

  @ApiProperty()
  @ValidateIf((o: CreateOrderDto) => o.deliveryType === DeliveryType.SELF)
  @IsString()
  @IsNotEmpty()
  shopAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shopCity?: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderPositionDto)
  positions: OrderPositionDto[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty()
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  promocode?: string;

  @ApiProperty()
  @ValidateIf((o: CreateOrderDto) => o.paymentType === PaymentType.SCHET)
  @ValidateNested()
  @Type(() => SchetInfoDto)
  schetInfo?: SchetInfoDto;
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
  @ValidateNested({ each: true })
  @Type(() => OrderPositionDto)
  positions: OrderPositionDto[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  promocode?: string;

  @ApiProperty({ required: false, enum: DeliveryType })
  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;
}

export class CreatePromocodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(100)
  skidka: number;
}
