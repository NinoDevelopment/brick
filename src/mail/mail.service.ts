import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { Order, DeliveryType, PaymentType } from "../order/schema/order";
import { ItemService } from "../item/item.service";
import { Item } from "../item/schema/item";

interface ItemGetter {
  findById(id: string): Promise<Item | null>;
}

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService, private config: ConfigService) {}

  async sendOrder(order: Order, itemGetter: ItemGetter) {
    const positions = await Promise.all(
      order.positions.map(async (position, i) => {
        const item = await itemGetter.findById(position.itemId);
        return `
          <table>
            <tbody>
              <tr><td>Товар:</td><td><a href="https://hleb365.ru/product/${position.itemId}">${
          item ? item.name : `Товар ${i + 1}`
        }</a></td></tr>
              <tr><td>Кол-во:</td><td>${position.quantity} шт.</td></tr>
              ${item && !item.available ? `<tr><td>Предзаказ:</td><td>Да</td></tr>` : ""}
            </tbody>
          </table>
          <br>`;
      }),
    );

    const oa = order.address;

    const address =
      order.deliveryType === DeliveryType.COURIER
        ? `${oa.address}${oa.entrance ? ` подъезд:${oa.entrance}` : ""}${
            oa.floor ? ` этаж:${oa.floor}` : ""
          }${oa.flat ? ` кв:${oa.flat}` : ""}${oa.intercom ? ` домофон:${oa.intercom}` : ""}`
        : order.shopAddress;

    return this.mailerService.sendMail({
      to: this.config.getOrThrow("ADMIN_MAIL").toString().split("|"),
      subject: "Новый заказ",
      template: "./order",
      context: {
        orderDate: order.createdAt.toString(),
        orderSum: `${order.amount}₽`,
        deliveryType: order.deliveryType === DeliveryType.COURIER ? "Курьер" : "Самовывоз",
        address: address,
        paymentType: order.paymentType === PaymentType.CASH ? "Наличными" : "Картой онлайн",
        orderStatus: order.completed ? "Завершен" : "Не завершен",
        buyerName: order.fullName,
        buyerPhone: order.phoneNumber,
        comment: order.comment ? order.comment : "Комментарий отсутствует",
        positions: positions.reduce((acc, curr) => acc + curr, ""),
      },
    });
  }
}
