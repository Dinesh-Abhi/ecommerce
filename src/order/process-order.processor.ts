import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../product/product.entity';
import { Order } from './order.entity';
import { User } from '../users/users.entity';
import logger from 'src/loggerfile/logger';

@Processor('orderQueue')
export class ProcessOrderProcessor {

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Process('placeOrder')
  async processOrder(job: Job) {
    const { userId, productIds, quantities } = job.data;
    logger.debug(`Processing order for user ${userId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const products = await this.productRepository.findBy({
      id: In(productIds),
    });

    const order = new Order();
    order.user = user;
    order.products = products;

    let total = 0;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const quantity = quantities[i];

      if (product.stock >= quantity) {
        product.stock -= quantity;
        await this.productRepository.save(product); 
        total += product.price * quantity;
      } else {
        throw new Error(`Not enough stock for product: ${product.name}`);
      }
    }

    order.total = total;
    await this.orderRepository.save(order);

    logger.info(`Order processed successfully for user ${userId}`);
  }
}
