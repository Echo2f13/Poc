import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

export interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable()
export class ProductsService {
  private products: Product[] = [
    { id: 1, name: 'Laptop Pro 16"', price: 1299.99 },
    { id: 2, name: 'Wireless Mouse', price: 29.99 },
    { id: 3, name: 'Mechanical Keyboard', price: 89.99 },
    { id: 4, name: 'Noise-Cancelling Headphones', price: 249.99 },
    { id: 5, name: 'USB-C Hub', price: 45.00 },
    { id: 6, name: 'Smartphone X12', price: 899.99 },
    { id: 7, name: '27" 4K Monitor', price: 449.99 },
    { id: 8, name: 'Webcam HD 1080p', price: 59.99 },
    { id: 9, name: 'Tablet Air 10"', price: 599.99 },
    { id: 10, name: 'Bluetooth Speaker', price: 39.99 },
    { id: 11, name: 'External SSD 1TB', price: 109.99 },
    { id: 12, name: 'Smartwatch Pro', price: 299.99 },
    { id: 13, name: 'Gaming Controller', price: 54.99 },
    { id: 14, name: 'Laptop Stand', price: 34.99 },
    { id: 15, name: 'Wireless Earbuds', price: 79.99 },
    { id: 16, name: 'Desk Lamp LED', price: 27.99 },
    { id: 17, name: 'Portable Charger 20000mAh', price: 35.99 },
    { id: 18, name: 'HDMI Cable 6ft', price: 12.99 },
    { id: 19, name: 'Mouse Pad XL', price: 15.99 },
    { id: 20, name: 'Camera DSLR Bundle', price: 749.99 },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  create(createProductDto: CreateProductDto): Product {
    const newProduct: Product = {
      id: this.products.length + 1,
      ...createProductDto,
    };
    this.products.push(newProduct);
    return newProduct;
  }
}
