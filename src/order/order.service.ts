import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Order, PaymentType, DeliveryType, Promocode, OrderDocument } from "./schema/order";
import { Model } from "mongoose";
import {
  CompanyByInnDto,
  CreateOrderDto,
  OrderAmountDto,
  OrderPositionDto,
  OrderStatusDto,
} from "./dto/order.dto";
import { Item } from "src/item/schema/item";
import { deliveryPrice, freeDeliveryThreshold } from "./constants";
import { MailService } from "../mail/mail.service";
import { ItemService } from "../item/item.service";
import { TelegramAPIService } from "../telegram/telegram.service";

interface ResolvedPosition {
  itemId: string;
  price: number;
  quantity: number;
  pack: number;
  discount: number;
}

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    @InjectModel(Item.name)
    private itemModel: Model<Item>,
    @InjectModel(Promocode.name)
    private promocodeModel: Model<Promocode>,
    private mailProvider: MailService,
    private itemService: ItemService,
    private telegramService: TelegramAPIService,
  ) {}

  async getPromocodes(): Promise<Promocode[]> {
    return this.promocodeModel.find().exec();
  }

  async createPromocode(code: string, skidka: number): Promise<boolean> {
    if (skidka > 100) return false;
    const exist = await this.promocodeModel.findOne({ code: code }).exec();
    if (exist) return false;
    const newPromocode = new this.promocodeModel({ code: code, skidka: skidka });
    await newPromocode.save();
    return true;
  }

  async removePromocode(code: string): Promise<boolean> {
    const exist = await this.promocodeModel.findOne({ code: code }).exec();
    if (!exist) return false;
    await exist.deleteOne();
    return true;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const positions = await this.resolvePositions(dto.positions);
    const orderAmount = await this.computeFinalAmount(positions, dto.deliveryType, dto.promocode);

    const order: Order = {
      orderId: await this.generateOrderId(),
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      fullName: dto.fullName,
      address: dto.address,
      shopAddress: dto.shopAddress,
      completed: false,
      positions: positions.map(({ itemId, price, quantity, pack }) => ({
        itemId,
        price,
        quantity,
        pack,
      })),
      amount: orderAmount,
      createdAt: new Date(),
      comment: dto.comment,
      paid: false,
      deliveryType: dto.deliveryType,
      paymentType: dto.paymentType,
      promocode: dto.promocode ?? "",
      ...(dto.paymentType === PaymentType.SCHET && dto.schetInfo
        ? { schetInfo: dto.schetInfo }
        : {}),
    };

    const createdOrder = new this.orderModel(order);

    setImmediate(() => {
      this.mailProvider.sendOrder(createdOrder, this.itemService).catch(console.error);
      this.telegramService.sendOrder(createdOrder, this.itemService).catch(console.error);
    });

    return createdOrder.save();
  }

  async calculateOrderAmount(
    positionsInput: OrderPositionDto[],
    promocode?: string,
    deliveryType?: DeliveryType,
  ): Promise<OrderAmountDto> {
    const positions = await this.resolvePositions(positionsInput);

    if (positions.length === 0) {
      return { amount: 0, amountWithDelivery: 0, discountedAmount: 0 };
    }

    const totals = this.calculateTotals(positions);
    let withDelivery =
      totals.amount >= freeDeliveryThreshold
        ? totals.discountedAmount
        : totals.discountedAmount + deliveryPrice;

    let amount = totals.amount;
    let discountedAmount = totals.discountedAmount;

    if (promocode) {
      const code = await this.promocodeModel.findOne({ code: promocode }).exec();
      if (code) {
        const discountFactor = code.skidka / 100;
        withDelivery = Math.max(0, withDelivery - withDelivery * discountFactor);
        amount = Math.max(0, amount - amount * discountFactor);
        discountedAmount = Math.max(0, discountedAmount - discountedAmount * discountFactor);
      }
    }

    if (deliveryType === DeliveryType.SELF) {
      withDelivery = discountedAmount;
    }

    return {
      amount,
      discountedAmount,
      amountWithDelivery: withDelivery,
    };
  }

  async findAll(): Promise<Order[]> {
    const orders = await this.orderModel.find().exec();
    return orders.filter((o) => !(o.paymentType === PaymentType.ONLINE && !o.paid));
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderModel.findById(id).exec();
  }

  async findPublicStatus(id: string): Promise<OrderStatusDto | null> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) return null;
    return this.toPublicStatus(order);
  }

  async complete(id: string): Promise<Order | null> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) return null;
    order.completed = true;

    return order.save();
  }

  async setPaid(orderId: string, val: boolean): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (order == null) throw new NotFoundException(`заказ ${orderId} не найден`);
    order.paid = val;
    return order.save();
  }

  private async resolvePositions(positions: OrderPositionDto[]): Promise<ResolvedPosition[]> {
    return Promise.all(
      positions.map(async (pos) => {
        const item = await this.itemModel.findById(pos.itemId).exec();
        if (!item) throw new NotFoundException(`товар ${pos.itemId} не найден`);
        if (!item.available) {
          throw new BadRequestException(`товар ${pos.itemId} недоступен для заказа`);
        }

        return {
          itemId: pos.itemId,
          price: item.price,
          quantity: pos.quantity,
          pack: item.pack,
          discount: item.discount,
        };
      }),
    );
  }

  private calculateTotals(positions: ResolvedPosition[]): {
    amount: number;
    discountedAmount: number;
  } {
    let amount = 0;
    let discountedAmount = 0;

    for (const pos of positions) {
      const itemTotal = pos.price * pos.quantity;
      amount += itemTotal;
      discountedAmount += itemTotal - itemTotal * (pos.discount / 100);
    }

    return { amount, discountedAmount: discountedAmount };
  }

  private async computeFinalAmount(
    positions: ResolvedPosition[],
    deliveryType: DeliveryType,
    promocode?: string,
  ): Promise<number> {
    const totals = this.calculateTotals(positions);
    let orderAmount = totals.discountedAmount;

    if (deliveryType === DeliveryType.COURIER && totals.amount < freeDeliveryThreshold) {
      orderAmount += deliveryPrice;
    }

    if (promocode) {
      const promo = await this.promocodeModel.findOne({ code: promocode }).exec();
      if (promo) {
        orderAmount = Math.max(0, orderAmount - orderAmount * (promo.skidka / 100));
      }
    }

    return orderAmount;
  }

  private toPublicStatus(order: OrderDocument): OrderStatusDto {
    const positions = order.positions.map((position) => ({
      itemId: position.itemId,
      quantity: position.quantity,
      pack: position.pack ?? 400,
    }));

    return {
      _id: order._id.toString(),
      orderId: order.orderId,
      amount: order.amount,
      paid: order.paid,
      completed: order.completed,
      paymentType: order.paymentType,
      deliveryType: order.deliveryType,
      shopAddress: order.shopAddress,
      address: order.address
        ? {
            city: order.address.city,
            address: order.address.address,
          }
        : undefined,
      positions,
      createdAt: order.createdAt,
    };
  }

  async lookupCompanyByInn(inn: string): Promise<CompanyByInnDto> {
    const data = await this.fetchDadata<{
      suggestions?: Array<{
        data?: {
          kpp?: string;
          name?: { short_with_opf?: string; full_with_opf?: string };
          address?: { unrestricted_value?: string; value?: string };
        };
      }>;
    }>("https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party", {
      query: inn,
    });

    const company = data.suggestions?.[0]?.data;
    if (!company) {
      throw new NotFoundException("Компания с таким ИНН не найдена");
    }

    return {
      inn,
      kpp: company.kpp ?? "",
      companyName: company.name?.short_with_opf ?? company.name?.full_with_opf ?? "",
      companyAddress: company.address?.unrestricted_value ?? company.address?.value ?? "",
    };
  }

  private async fetchDadata<T>(url: string, body: Record<string, string>): Promise<T> {
    const token = this.unquote(process.env["DADATA_TOKEN"]);
    if (!token) {
      throw new InternalServerErrorException("Сервис автозаполнения не настроен");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new BadRequestException("Не удалось получить данные из DaData");
    }

    return (await response.json()) as T;
  }

  private unquote(value?: string): string {
    return value?.replace(/^['"]|['"]$/g, "") ?? "";
  }

  private async generateOrderId(): Promise<string> {
    const currentYear = new Date().getFullYear().toString();
    const lastOrder = await this.orderModel.findOne({}, {}, { sort: { createdAt: -1 } }).exec();
    const lastOrderId = lastOrder?.orderId;

    if (lastOrderId && lastOrderId.length >= 4) {
      const lastOrderYear = lastOrderId.slice(0, 4);
      if (lastOrderYear === currentYear) {
        const lastOrderNumber = Number.parseInt(lastOrderId.slice(4), 10);
        const nextOrderNumber = Number.isFinite(lastOrderNumber)
          ? lastOrderNumber + 1
          : 1;
        return currentYear + nextOrderNumber.toString().padStart(6, "0");
      }
    }

    return currentYear + "000001";
  }
}
