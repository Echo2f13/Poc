import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const { data, total } = await this.usersService.findAll(p, l);
    return {
      data,
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { data: await this.usersService.findOnePublic(id) };
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return { data: await this.usersService.create(createUserDto) };
  }
}
