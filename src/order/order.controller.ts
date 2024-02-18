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
  CreatePromocodeDto
} from "./dto/order.dto";
import { PaymentProvider } from "src/payment/payment.provider";
import { AuthGuard } from "src/auth/auth.guard";
import { TelegramAPIService } from "src/telegram/telegram.service";

@Controller("order")
export class OrderController {
  constructor(
    private orderService: OrderService,
    private paymentProvider: PaymentProvider,
    private tegramProvider: TelegramAPIService
  ) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.orderService.create(createOrderDto);
  }

  @Post("/amount")
  async calculateOrderAmount(@Body() req: CalculateOrderAmountRequest): Promise<OrderAmountDto> {
    return this.orderService.calculateOrderAmount(req.positions);
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
  async findOne(@Param() params: FindOneParams): Promise<Order> {
    const order = await this.orderService.findById(params.id);
    if (!order) throw new NotFoundException("заказ не найден");
    return order;
  }

  @Post("/plati/:id")
  async payForOrder(@Param() params: FindOneParams): Promise<{ confirmationURL: string }> {
    const payment = await this.paymentProvider.create(params.id);
    return { confirmationURL: payment.confirmURL };
  }

  @Post("/callme")
  async callMe(@Body() req: CallMeDto): Promise<{success: boolean}> {
    const msg = await this.tegramProvider.sendCallmeRequest(req);
    console.log(msg[0]);
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
