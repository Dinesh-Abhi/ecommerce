import { IsNumber, IsPositive } from 'class-validator';

export class CreateCartDto {
  @IsNumber()
  @IsPositive()
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
