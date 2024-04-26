import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { Order, DeliveryType, PaymentType, OrderPosition } from "../order/schema/order";
import { Item } from "../item/schema/item";

import { PDFDocument, PDFPage, PDFFont } from "pdf-lib";
import * as fs from "fs";
const fontkit = require("fontkit");
const path = require("path");

const templatePath = path.join(__dirname, "templates", "template.pdf");
const fontPath = path.join(__dirname, "templates", "DejaVuSans.ttf");
const outputPath = path.join(__dirname, "templates", "order.pdf");

interface ItemGetter {
  findById(id: string): Promise<Item | null>;
}

interface PreparedOrder {
  orderId: string;
  deliveryAddress: string;
  companyInfo: string;
  orderDate: string;
  orderSum: string;
  deliveryType: string;
  paymentType: string;
  orderStatus: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  comment: string;
}

interface Position {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

@Injectable()
export class MailService {
  private readonly url: string;
  constructor(private mailerService: MailerService, private config: ConfigService) {
    this.url = this.config.getOrThrow("URL");
  }

  async prepareOrder(order: Order): Promise<PreparedOrder> {
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

    const companyInfo =
      order.paymentType === PaymentType.SCHET
        ? `${order.schetInfo?.companyName}, ИНН ${order.schetInfo?.inn}, КПП ${order.schetInfo?.kpp}, ${order.schetInfo?.companyAddress}`
        : "";

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

    const preparedOrder: PreparedOrder = {
      orderId: order.orderId,
      deliveryAddress,
      companyInfo,
      orderDate: this.getMoscowDateTimeString(order.createdAt, true),
      orderSum: `${order.amount}₽`,
      deliveryType: order.deliveryType === DeliveryType.COURIER ? "Курьер" : "Самовывоз",
      paymentType: paymentType,
      orderStatus: order.completed ? "Завершен" : "Не завершен",
      buyerName: order.fullName,
      buyerPhone: order.phoneNumber,
      buyerEmail: order.email ? order.email : "",
      comment: order.comment ? order.comment : "Комментарий отсутствует",
    };
    // await this.generatePDFWithText(preparedOrder, order.positions); для тестов
    return preparedOrder;
  }

  async sendOrder(order: Order, itemGetter: ItemGetter) {
    try {
      console.log("try sendOrder");
      const positions: Position[] = await Promise.all(
        order.positions.map(async (position, i) => {
          const item = await itemGetter.findById(position.itemId);
          return {
            itemId: position.itemId,
            name: item?.name || `Товар ${i + 1}`,
            price: position.price || 0,
            quantity: position.quantity,
          };
        }),
      );

      const preparedOrder = await this.prepareOrder(order);
      const url = this.url ? `https://${this.url}` : "";
      const orderData = {
        positions: positions.map((position) => ({
          ...position,
          url: url ? `${url}/product/${position.itemId}` : "",
        })),
        ...preparedOrder,
      };
      const attachments = [];
      if (order.paymentType === PaymentType.SCHET) {
        try {
          await this.generatePDFWithText(preparedOrder, positions);
          attachments.push({
            filename: "order.pdf",
            path: outputPath,
            contentType: "application/pdf",
          });
        } catch (error) {
          console.error("Error generating PDF:", error);
        }
      }
      console.log("sending email to customer");
      await this.mailerService.sendMail({
        to: preparedOrder.buyerEmail,
        subject: "Новый заказ",
        template: "./thanks",
        context: {
          ...orderData,
        },
        attachments,
      });
      console.log("sending email to admin");
      await this.mailerService.sendMail({
        to: this.config.getOrThrow("ADMIN_MAIL").toString().split("|"),
        subject: "Новый заказ",
        template: "./order",
        context: {
          ...orderData,
        },
        attachments,
      });

      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (error) {
      console.error("Ошибка при отправке письма:", error.message);
      throw new Error("Ошибка при отправке письма");
    }
  }

  public getMoscowDateTimeString(date: Date, time: boolean) {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Europe/Moscow",
      month: "short",
      day: "2-digit",
      year: "numeric",
    };
    if (time) {
      options.hour12 = false;
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.second = "2-digit";
    }
    return date.toLocaleString("ru-RU", options);
  }

  public async generatePDFWithText(order: PreparedOrder, positions: Position[]): Promise<void> {
    try {
      if (!fs.existsSync(templatePath) || !fs.existsSync(fontPath)) {
        throw new Error("Template or font file not found");
      }

      const templateBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit);

      const fontBytes = fs.readFileSync(fontPath);
      const dejavuSansFont = await pdfDoc.embedFont(fontBytes);
      const page = pdfDoc.getPages()[0];

      const totalCosts = positions.map((position) => ({
        itemId: position.itemId,
        totalCost: position.price * position.quantity,
      }));

      this.drawWrappedText(page, order.orderId, {
        x: 165,
        y: 707,
        maxWidth: 450,
        lineHeight: 9,
        font: dejavuSansFont,
        fontSize: 12,
      });

      this.drawWrappedText(page, this.getMoscowDateTimeString(new Date(), false), {
        x: 300,
        y: 707,
        maxWidth: 450,
        lineHeight: 9,
        font: dejavuSansFont,
        fontSize: 12,
      });

      this.drawWrappedText(page, order.companyInfo, {
        x: 100,
        y: 653,
        maxWidth: 450,
        lineHeight: 9,
        font: dejavuSansFont,
      });

      this.drawWrappedText(page, positions.length.toString(), {
        x: 130,
        y: 470,
        maxWidth: 450,
        lineHeight: 9,
        font: dejavuSansFont,
      });

      const totalCostSum = totalCosts.reduce((sum, position) => sum + position.totalCost, 0);
      const totalCostSumNDS = totalCostSum * 20 / 120;
      const formattedTotalCostSum = totalCostSum.toLocaleString("ru-RU", {
        style: "currency",
        currency: "RUB",
      });
      const formattedTotalCostSumNDS = totalCostSumNDS.toLocaleString("ru-RU", {
        style: "currency",
        currency: "RUB",
      });
      this.drawWrappedText(page, formattedTotalCostSum, {
        x: 190,
        y: 470,
        maxWidth: 450,
        lineHeight: 9,
        font: dejavuSansFont,
      });
      this.drawWrappedText(page, formattedTotalCostSum, {
        x: 450,
        y: 504,
        maxWidth: 450,
        lineHeight: 9,
        font: dejavuSansFont,
      });
      this.drawWrappedText(page, formattedTotalCostSumNDS, {
        x: 450,
        y: 492.5,
        maxWidth: 450,
        lineHeight: 9,
        font: dejavuSansFont,
      });
      this.drawWrappedText(page, formattedTotalCostSum, {
        x: 450,
        y: 481,
        maxWidth: 450,
        lineHeight: 9,
        font: dejavuSansFont,
      });

      for (let i = 0; i <= positions.length - 1; i++) {
        this.drawWrappedText(page, positions[i].name, {
          x: 70,
          y: 595 - i * 10.5,
          maxWidth: 450,
          lineHeight: 9,
          font: dejavuSansFont,
        });

        this.drawWrappedText(page, positions[i].quantity.toString(), {
          x: 300,
          y: 595 - i * 10.5,
          maxWidth: 450,
          lineHeight: 9,
          font: dejavuSansFont,
        });

        const positionCost = positions[i].price.toLocaleString("ru-RU", {
          style: "currency",
          currency: "RUB",
        });
        this.drawWrappedText(page, positionCost, {
          x: 380,
          y: 595 - i * 10.5,
          maxWidth: 450,
          lineHeight: 9,
          font: dejavuSansFont,
        });

        const positionTotalCost = totalCosts[i].totalCost.toLocaleString("ru-RU", {
          style: "currency",
          currency: "RUB",
        });
        this.drawWrappedText(page, positionTotalCost, {
          x: 450,
          y: 595 - i * 10.5,
          maxWidth: 450,
          lineHeight: 9,
          font: dejavuSansFont,
        });
      }

      const modifiedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, modifiedPdfBytes);

      console.log("PDF generated successfully");
    } catch (error) {
      throw new Error();
    }
  }

  private async drawWrappedText(
    page: PDFPage,
    text: string,
    options: {
      x: number;
      y: number;
      maxWidth: number;
      lineHeight: number;
      font: PDFFont;
      fontSize?: number;
    },
  ): Promise<void> {
    const words = text.split(" ");
    let currentLine = "";
    let currentY = options.y;
    const fontSize = options.fontSize || 9;

    for (const word of words) {
      if (options.font.widthOfTextAtSize(currentLine + " " + word, fontSize) < options.maxWidth) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine.trim() !== "") {
          page.drawText(currentLine, {
            x: options.x,
            y: currentY,
            font: options.font,
            size: fontSize,
          });
          currentY -= options.lineHeight;
        }
        currentLine = word;
      }
    }

    if (currentLine.trim() !== "") {
      page.drawText(currentLine, {
        x: options.x,
        y: currentY,
        font: options.font,
        size: fontSize,
      });
    }
  }
}
