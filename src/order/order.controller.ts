import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { Order, Promocode } from "./schema/order";
import {
  CalculateOrderAmountRequest,
  CreateOrderDto,
  FindOneParams,
  OrderAmountDto,
  CallMeDto,
  CreatePromocodeDto,
  OrderStatusDto,
} from "./dto/order.dto";
import { PaymentProvider } from "src/payment/payment.provider";
import { AuthGuard } from "src/auth/auth.guard";
import { TelegramAPIService } from "src/telegram/telegram.service";
import { MailService } from "src/mail/mail.service";

@Controller("order")
export class OrderController {
  constructor(
    private orderService: OrderService,
    private paymentProvider: PaymentProvider,
    private tegramProvider: TelegramAPIService,
    private mailProvider: MailService,
  ) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.orderService.create(createOrderDto);
  }

  @Post("/amount")
  async calculateOrderAmount(@Body() req: CalculateOrderAmountRequest): Promise<OrderAmountDto> {
    return this.orderService.calculateOrderAmount(req.positions, req.promocode, req.deliveryType);
  }

  @Put("/complete/:id")
  @UseGuards(AuthGuard)
  async complete(@Param() params: FindOneParams): Promise<Order> {
    const order = await this.orderService.complete(params.id);
    if (!order) throw new NotFoundException("заказ не найден");
    return order;
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(): Promise<Order[]> {
    return this.orderService.findAll();
  }

  @Get(":id")
  async findOne(@Param() params: FindOneParams): Promise<OrderStatusDto> {
    const order = await this.orderService.findPublicStatus(params.id);
    if (!order) throw new NotFoundException("заказ не найден");
    return order;
  }

  @Post("/plati/:id")
  async payForOrder(@Param() params: FindOneParams): Promise<{ confirmationURL: string }> {
    const payment = await this.paymentProvider.create(params.id);
    return { confirmationURL: payment.confirmURL };
  }

  @Post("/callme")
  async callMe(@Body() req: CallMeDto): Promise<{ success: boolean }> {
    setImmediate(() => {
      this.tegramProvider.sendCallmeRequest(req).catch((error) => {
        console.error("Ошибка отправки заявки в Telegram:", error);
      });
      this.mailProvider.sendCallmeRequest(req).catch((error) => {
        console.error("Ошибка отправки заявки на почту:", error);
      });
    });
    return { success: true };
  }

  @Post("all-promocodes")
  @UseGuards(AuthGuard)
  async getPromocodes(): Promise<Promocode[]> {
    console.log("order/promocode");
    return await this.orderService.getPromocodes();
  }

  @Post("create-promocode")
  @UseGuards(AuthGuard)
  async createPromocode(@Body() req: CreatePromocodeDto): Promise<{ success: boolean }> {
    return { success: await this.orderService.createPromocode(req.code, req.skidka) };
  }

  @Delete("promocode/:code")
  @UseGuards(AuthGuard)
  async removePromocode(@Param("code") code: string): Promise<{ success: boolean }> {
    return { success: await this.orderService.removePromocode(code) };
  }
}
