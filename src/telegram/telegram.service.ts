import { Injectable } from "@nestjs/common";
import { TelegramMessage, TelegramService, TelegramUser } from "nestjs-telegram";
import { DeliveryType, Order, PaymentType } from "../order/schema/order";
import { Item } from "../item/schema/item";
import { CallMeDto } from "../order/dto/order.dto";
import { ConfigService } from "@nestjs/config";

interface ItemGetter {
  findById(id: string): Promise<Item | null>;
}
@Injectable()
export class TelegramAPIService {
  constructor(private config: ConfigService, private readonly bot: TelegramService) {}

  testBot(): Promise<TelegramUser> {
    return this.bot.getMe().toPromise();
  }

  async sendCallmeRequest(req: CallMeDto): Promise<TelegramMessage[]> {
    const chats = this.config.getOrThrow("TELEGRAM_CHAT_IDS").toString().split(",");
    console.log("chats: ", chats);
    return Promise.all(
      chats.map((chat_id: string) =>
        this.bot
          .sendMessage({
            chat_id: chat_id,
            text: `Запроc на связь от пользователя
Имя: ${req.name}
Компания: ${req.companyName}
Email: ${req.email}
Текст: ${req.text}`,
          })
          .toPromise(),
      ),
    );
  }

  async sendOrder(order: Order, itemGetter: ItemGetter): Promise<TelegramMessage[]> {
    const chats = this.config.getOrThrow("TELEGRAM_CHAT_IDS").toString().split(",");

    const positions = await Promise.all(
      order.positions.map(async (position) => {
        const item = await itemGetter.findById(position.itemId);
        if (item === null) return "";
        return `*Товар:* [${item.name}](https://brick-nn.sbs/product/${position.itemId})
*Кол-во:* ${position.quantity} шт.

`;
      }),
    );
    const oa = order.address;

    const address =
      order.deliveryType === DeliveryType.COURIER
        ? `${oa.address}${oa.entrance ? ` подъезд:${oa.entrance}` : ""}${
            oa.floor ? ` этаж:${oa.floor}` : ""
          }${oa.flat ? ` кв:${oa.flat}` : ""}${oa.intercom ? ` домофон:${oa.intercom}` : ""}`
        : order.shopAddress;

    const params = {
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
    };

    return Promise.all(
      chats.map((chat_id: string) =>
        this.bot
          .sendMessage({
            chat_id: chat_id,
            disable_web_page_preview: true,
            text: `*Информация о заказе:*
*Дата:* ${params.orderDate}
*Сумма:* ${params.orderSum}
*Доставка:* ${params.deliveryType}
*Адрес:* ${address}
*Тип оплаты:* ${params.paymentType}
*Статус заказа:* ${params.orderStatus}

*Информация о покупателе:*
*Имя:* ${params.buyerName}
*Телефон:* ${params.buyerPhone}
*Комментарий:* ${params.comment}

*Товары:*
${params.positions}
`,
            parse_mode: "markdown",
          })
          .toPromise(),
      ),
    );
  }
}
