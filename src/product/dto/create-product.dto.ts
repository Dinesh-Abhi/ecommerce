import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDecimal, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Price of the product',
    type: Number,
  })
  @IsDecimal()
  price: number;

  @ApiProperty({
    description: 'Stock quantity of the product',
    type: Number,
  })
  @IsInt()
  @Min(0) 
  stock: number;

  @ApiProperty({
    description: 'Product image file',
    type: 'string',
    format: 'binary',
  })
  image: any; 
}
