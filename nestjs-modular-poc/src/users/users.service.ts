import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(page = 1, limit = 20): Promise<{ data: Partial<User>[]; total: number }> {
    const [rows, total] = await this.usersRepository.findAndCount({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const data = rows.map((u) => this.toPublic(u));
    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findOnePublic(id: string): Promise<Partial<User>> {
    const user = await this.findOne(id);
    return this.toPublic(user);
  }

  private toPublic(user: User): Partial<User> {
    const { passwordHash: _ph, deletedAt: _da, ...safe } = user;
    return safe;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase(), deletedAt: IsNull() },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = this.usersRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      passwordHash: 'placeholder',
    });
    return this.usersRepository.save(user);
  }

  async createWithHash(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const user = this.usersRepository.create({
      ...data,
      email: data.email.toLowerCase(),
    });
    return this.usersRepository.save(user);
  }
}
