import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('orders-queue')
export class OrdersProcessor {
  @Process('processOrder')
  async handleOrder(job: Job) {
    console.log('Processing order:', job.data);
    // Simulate order processing logic (e.g., updating order status)
    // You can add more complex business logic here
  }
}
