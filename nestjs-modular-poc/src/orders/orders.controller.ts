import { Controller, Get, Post, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { Order } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(): Order[] {
    return this.ordersService.findAll();
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto): Order {
    return this.ordersService.create(createOrderDto);
  }
}
