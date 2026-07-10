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
  private readonly url: string;
  constructor(private config: ConfigService, private readonly bot: TelegramService) {
    const rawUrl = this.config.getOrThrow("URL").toString().trim();
    this.url =
      (rawUrl.startsWith('"') && rawUrl.endsWith('"')) ||
      (rawUrl.startsWith("'") && rawUrl.endsWith("'"))
        ? rawUrl.slice(1, -1)
        : rawUrl;
  }

  testBot(): Promise<TelegramUser> {
    return this.bot.getMe().toPromise();
  }

  private chatIds(): string[] {
    return this.config
      .getOrThrow("TELEGRAM_CHAT_IDS")
      .toString()
      .replace(/^["']|["']$/g, "")
      .split(",")
      .map((id: string) => id.trim())
      .filter(Boolean);
  }

  async sendCallmeRequest(req: CallMeDto): Promise<TelegramMessage[]> {
    const chats = this.chatIds();
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
    const chats = this.chatIds();

    const positions = await Promise.all(
      order.positions.map(async (position) => {
        const item = await itemGetter.findById(position.itemId);
        if (item === null) return "";
        return `*Товар:* [${item.name}](https://${this.url}/product/${position.itemId})
*Кол-во:* ${position.quantity} шт.

`;
      }),
    );
    const oa = order.address;

    const deliveryAddress =
      order.deliveryType === DeliveryType.COURIER
        ? `${oa.city}, ${oa.address}` +
          (oa.entrance ? `, подъезд:${oa.entrance}` : "") +
          (oa.floor ? `, этаж:${oa.floor}` : "") +
          (oa.flat ? `, кв:${oa.flat}` : "") +
          (oa.intercom ? `, домофон:${oa.intercom}` : "") +
          (oa.commentAddress ? `, ${oa.commentAddress}` : "")
        : order.shopAddress;

    let paymentType: string;
    switch (order.paymentType) {
      case PaymentType.CASH:
        paymentType = "Наличными";
        break;
      case PaymentType.ONLINE:
        paymentType = "Картой онлайн";
        break;
      case PaymentType.SCHET:
        paymentType = "Выставлен счет";
        break;
      default:
        paymentType = "";
        break;
    }

    const params = {
      orderId: order.orderId,
      orderDate: this.getMoscowDateTimeString(order.createdAt),
      orderSum: `${order.amount}₽`,
      deliveryType: order.deliveryType === DeliveryType.COURIER ? "Курьер" : "Самовывоз",
      address: deliveryAddress,
      paymentType,
      orderStatus: order.completed ? "Завершен" : "Не завершен",
      buyerName: order.fullName,
      buyerPhone: order.phoneNumber,
      buyerEmail: order.email ? order.email : "",
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
*Номер заказа:* ${params.orderId}
*Дата:* ${params.orderDate}
*Сумма:* ${params.orderSum}
*Доставка:* ${params.deliveryType}
*Адрес:* ${deliveryAddress}
*Тип оплаты:* ${params.paymentType}
*Статус заказа:* ${params.orderStatus}

*Информация о покупателе:*
*Имя:* ${params.buyerName}
*Телефон:* ${params.buyerPhone}
*Email:* ${params.buyerEmail}
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

  public getMoscowDateTimeString(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Moscow',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return date.toLocaleString('en-US', options);
  }
}
