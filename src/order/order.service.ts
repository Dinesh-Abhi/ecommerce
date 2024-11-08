import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from './order.entity';
import { User } from '../users/users.entity';
import { Product } from '../product/product.entity';
import { PlaceOrderDto } from './dto/create-order.dto';
import logger from 'src/loggerfile/logger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class OrderService {

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectQueue('orderQueue') private orderQueue: Queue
  ) {}

 
  async placeOrder(placeOrderDto: PlaceOrderDto): Promise<any> {
    const { userId, productIds, quantities } = placeOrderDto;

    try {
      logger.debug(`Placing order for user ${userId} with product IDs: ${productIds}`);
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        logger.error(`User with ID ${userId} not found`);
        return { Error: true, message: 'User not found' };
      }
      const products = await this.productRepository.findBy({
        id: In(productIds),
      });

      if (!products.length) {
        logger.error(`Products with IDs ${productIds} not found`);
        return { Error: true, message: 'Products not found' };
      }
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const quantity = quantities[i];
        if (product.stock < quantity) {
          logger.error(`Not enough stock for product ${product.name}`);
          return { Error: false, message: `Not enough stock for '${product.name}' product try again later` };
        }
      }

      const orderPayload = { userId, productIds, quantities };
      await this.orderQueue.add('placeOrder', orderPayload);

      return { Error: false, message: 'Order placed successfully.' };
    } catch (error) {
      logger.error(`Error placing order: ${error.message}`);
      return { Error: true, message: error.message || 'An error occurred while placing the order' };
    }
  }


  async getUserOrders(userId: number): Promise<Order[]> {
    logger.debug(`Fetching orders for user ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['orders', 'orders.products'],
    });

    if (!user) {
      logger.error(`User with ID ${userId} not found`);
      throw new Error('User not found');
    }

    logger.info(`Successfully fetched orders for user ${userId}`);
    return user.orders;
  }
}
