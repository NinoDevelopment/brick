import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, PaymentType, DeliveryType } from './schema/order';
import { Model } from 'mongoose';
import { CreateOrderDto, OrderAmountDto, OrderPositionDto } from './dto/order.dto';
import { Item } from 'src/item/schema/item';
import { deliveryPrice, freeDeliveryThreshold } from './constants';
import { MailService } from '../mail/mail.service';
import { ItemService } from '../item/item.service';
import { TelegramAPIService } from '../telegram/telegram.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    @InjectModel(Item.name)
    private itemModel: Model<Item>,
    private mailProvider: MailService,
    private itemService: ItemService,
    private telegramService: TelegramAPIService,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    let amount = 0;
    let discountedAmount = 0;
    for (const pos of dto.positions) {
      const item = await this.itemModel.findById(pos.itemId).exec();
      if (!item) throw new NotFoundException(`товар ${pos.itemId} не найден`);

      if (!item.prices.find((p) => p.price === pos.price && p.weight === pos.weight))
        throw new NotFoundException(
          `позиция по товару ${pos.itemId} с ценой ${pos.price} и весом ${pos.weight} не найдена`,
        );

      const price = pos.price * pos.quantity;

      amount += price;

      const discountedPrice = price - price * (item.discount / 100);

      discountedAmount += discountedPrice;
    }

    const orderAmount =
      amount >= freeDeliveryThreshold || dto.deliveryType !== DeliveryType.COURIER ? discountedAmount : discountedAmount + deliveryPrice;

    console.log(orderAmount);

    const order: Order = {
      phoneNumber: dto.phoneNumber,
      fullName: dto.fullName,
      address: dto.address,
      shopAddress: dto.shopAddress,
      completed: false,
      positions: dto.positions,
      amount: orderAmount,
      createdAt: new Date(),
      comment: dto.comment,
      paid: false,
      deliveryType: dto.deliveryType,
      paymentType: dto.paymentType,
    };

    console.log(order);

    const createdOrder = new this.orderModel(order);

    setImmediate(() => {
      this.mailProvider.sendOrder(createdOrder, this.itemService);
      this.telegramService.sendOrder(createdOrder, this.itemService);
    })

    return createdOrder.save();
  }

  async calculateOrderAmount(positions: OrderPositionDto[]): Promise<OrderAmountDto> {
    if (positions.length === 0) {
      return { amount: 0, amountWithDelivery: 0, discountedAmount: 0 };
    }
    let amount = 0;
    let discountedAmount = 0;
    for (const pos of positions) {
      const item = await this.itemModel.findById(pos.itemId).exec();
      if (!item) throw new NotFoundException(`товар ${pos.itemId} не найден`);

      if (!item.prices.find((p) => p.price === pos.price && p.weight === pos.weight))
        throw new NotFoundException(
          `позиция по товару ${pos.itemId} с ценой ${pos.price} и весом ${pos.weight} не найдена`,
        );

      const price = pos.price * pos.quantity;

      amount += price;

      const discountedPrice = price - price * (item.discount / 100);

      discountedAmount += discountedPrice;
    }

    const withDelivery =
      amount >= freeDeliveryThreshold ? discountedAmount : discountedAmount + deliveryPrice;

    return {
      amount: amount,
      discountedAmount: discountedAmount,
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
}
