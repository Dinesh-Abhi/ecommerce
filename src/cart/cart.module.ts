import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart } from './cart.entity';
import { User } from 'src/users/users.entity';
import { ProductModule } from 'src/product/product.module'; // Import the ProductModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, User]), // Include Cart and User repositories
    ProductModule, // Import ProductModule to make ProductRepository available
  ],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
