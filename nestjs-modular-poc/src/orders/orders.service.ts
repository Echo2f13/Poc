import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';

export interface Order {
  id: number;
  userId: number;
  productId: number;
  userName?: string;
  productName?: string;
}

@Injectable()
export class OrdersService {
  private orders: Order[] = [
    { id: 1, userId: 1, productId: 1 },
    { id: 2, userId: 1, productId: 4 },
    { id: 3, userId: 2, productId: 6 },
    { id: 4, userId: 3, productId: 1 },
    { id: 5, userId: 3, productId: 3 },
    { id: 6, userId: 3, productId: 12 },
    { id: 7, userId: 4, productId: 7 },
    { id: 8, userId: 5, productId: 2 },
    { id: 9, userId: 5, productId: 10 },
    { id: 10, userId: 6, productId: 9 },
    { id: 11, userId: 6, productId: 15 },
    { id: 12, userId: 7, productId: 20 },
    { id: 13, userId: 8, productId: 5 },
    { id: 14, userId: 8, productId: 11 },
    { id: 15, userId: 9, productId: 8 },
    { id: 16, userId: 10, productId: 13 },
    { id: 17, userId: 10, productId: 16 },
    { id: 18, userId: 11, productId: 14 },
    { id: 19, userId: 12, productId: 17 },
    { id: 20, userId: 12, productId: 18 },
    { id: 21, userId: 13, productId: 1 },
    { id: 22, userId: 13, productId: 19 },
    { id: 23, userId: 14, productId: 6 },
    { id: 24, userId: 14, productId: 4 },
    { id: 25, userId: 15, productId: 7 },
    { id: 26, userId: 15, productId: 3 },
    { id: 27, userId: 15, productId: 12 },
    { id: 28, userId: 1, productId: 9 },
    { id: 29, userId: 2, productId: 20 },
    { id: 30, userId: 4, productId: 15 },
  ];

  constructor(
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  findAll(): Order[] {
    return this.orders.map((order) => {
      const user = this.usersService.findOne(order.userId);
      const product = this.productsService.findOne(order.productId);
      return {
        ...order,
        userName: user?.name,
        productName: product?.name,
      };
    });
  }

  create(createOrderDto: CreateOrderDto): Order {
    const newOrder: Order = {
      id: this.orders.length + 1,
      ...createOrderDto,
    };
    this.orders.push(newOrder);
    return newOrder;
  }
}
