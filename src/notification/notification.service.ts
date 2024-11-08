import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  @Cron(CronExpression.EVERY_HOUR)
  handleCron() {
    console.log('Sending periodic notifications...');
  }
}
