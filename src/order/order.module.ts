import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './order.entity';
import { User } from '../users/users.entity';
import { Product } from '../product/product.entity';
import { ProcessOrderProcessor } from './process-order.processor'; // Processor for Bull queue

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Product]),
    BullModule.registerQueue({
      name: 'orderQueue',
      redis: { host: 'localhost', port: 6379 },
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService, ProcessOrderProcessor],
})
export class OrderModule {}
