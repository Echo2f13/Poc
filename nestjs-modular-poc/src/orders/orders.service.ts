import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '../common/types/enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
  ) {}

  async findAll(page = 1, limit = 20): Promise<{ data: Order[]; total: number }> {
    const [data, total] = await this.ordersRepository.findAndCount({
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product', 'address'],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.ordersRepository.create({
      userId: createOrderDto.userId,
      status: OrderStatus.PENDING,
      subtotal: 0,
      tax: 0,
      total: 0,
    });
    return this.ordersRepository.save(order);
  }
}
