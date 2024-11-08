import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './order.entity';
import { PlaceOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('place')
  @ApiOperation({ summary: 'Place an order' })
  @ApiResponse({ status: 201, description: 'Order placed successfully' })
  @ApiResponse({ status: 400, description: 'User or products not found' })
  async placeOrder(@Body() placeOrderDto: PlaceOrderDto): Promise<any> {
    return this.orderService.placeOrder(placeOrderDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all orders for a user' })
  @ApiResponse({ status: 200, description: 'Returns the list of orders', type: [Order] })
  async getUserOrders(@Param('userId') userId: number): Promise<Order[]> {
    return this.orderService.getUserOrders(userId);
  }
}
