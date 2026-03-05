import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 1, name: 'John Smith', email: 'john@example.com' },
    { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
    { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 4, name: 'Bob Williams', email: 'bob@example.com' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com' },
    { id: 6, name: 'Diana Prince', email: 'diana@example.com' },
    { id: 7, name: 'Edward Norton', email: 'edward@example.com' },
    { id: 8, name: 'Fiona Apple', email: 'fiona@example.com' },
    { id: 9, name: 'George Miller', email: 'george@example.com' },
    { id: 10, name: 'Hannah Lee', email: 'hannah@example.com' },
    { id: 11, name: 'Ivan Petrov', email: 'ivan@example.com' },
    { id: 12, name: 'Julia Roberts', email: 'julia@example.com' },
    { id: 13, name: 'Kevin Hart', email: 'kevin@example.com' },
    { id: 14, name: 'Laura Chen', email: 'laura@example.com' },
    { id: 15, name: 'Michael Scott', email: 'michael@example.com' },
  ];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  create(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: this.users.length + 1,
      ...createUserDto,
    };
    this.users.push(newUser);
    return newUser;
  }
}
