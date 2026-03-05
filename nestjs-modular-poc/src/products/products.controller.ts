import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import type { Product } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Product[] {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Product | undefined {
    return this.productsService.findOne(Number(id));
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto): Product {
    return this.productsService.create(createProductDto);
  }
}
