import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const { data, total } = await this.ordersService.findAll(p, l);
    return {
      data,
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { data: await this.ordersService.findOne(id) };
  }

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return { data: await this.ordersService.create(createOrderDto) };
  }
}
