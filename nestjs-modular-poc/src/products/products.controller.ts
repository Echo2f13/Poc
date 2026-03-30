import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const { data, total } = await this.productsService.findAll(p, l);
    return {
      data,
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { data: await this.productsService.findOne(id) };
  }

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return { data: await this.productsService.create(createProductDto) };
  }
}
