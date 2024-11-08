import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class OrdersQueueService {
  constructor(@InjectQueue('orders-queue') private readonly ordersQueue: Queue) {}

  async addOrderToQueue(order: any) {
    await this.ordersQueue.add('processOrder', order);
  }
}
