import { IsUUID, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  addressId?: string;
}
