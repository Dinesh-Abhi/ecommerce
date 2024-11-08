import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ type: String })
  @IsString()
  productId: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  quantity: number;
}

export class PlaceOrderDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  userId: number;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  productIds: number[];

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  quantities: number[];
}