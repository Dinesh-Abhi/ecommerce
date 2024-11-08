import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart } from './cart.entity';
import { CreateCartDto } from './dto/add-to-cart.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import logger from 'src/loggerfile/logger';

@ApiTags('Cart') // Group routes under 'Cart' in Swagger
@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({ summary: 'Add product to cart' })
  @ApiBody({ type: CreateCartDto }) // Bind DTO to request body
  @ApiResponse({ status: 201, description: 'Product added to cart', type: Cart })
  async addProductToCart(
    @Body() createCartDto: CreateCartDto,
    @Param('userId') userId: number,
  ): Promise<Cart> {
    logger.debug(`Request to add product to cart for user ${userId}`);
    try {
      const cart = await this.cartService.addProductToCart(createCartDto, userId);
      logger.info(`Successfully added product to cart for user ${userId}`);
      return cart;
    } catch (error) {
      logger.error('Error adding product to cart', error.stack);
      throw error;
    }
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get cart items for user' })
  @ApiResponse({ status: 200, description: 'Returns list of cart items', type: [Cart] })
  async getCart(@Param('userId') userId: number): Promise<Cart[]> {
    logger.debug(`Request to get cart items for user ${userId}`);
    try {
      const cartItems = await this.cartService.getCart(userId);
      logger.info(`Successfully fetched cart items for user ${userId}`);
      return cartItems;
    } catch (error) {
      logger.error('Error fetching cart items', error.stack);
      throw error;
    }
  }

  @Post('buy/:userId')
  @ApiOperation({ summary: 'Attempt to buy products in the cart' })
  @ApiResponse({ status: 200, description: 'Purchase successful' })
  async buyCart(@Param('userId') userId: number): Promise<string> {
    logger.debug(`User ${userId} is attempting to purchase cart items`);
    try {
      const purchaseStatus = await this.cartService.buyCart(userId);
      logger.info(`User ${userId} successfully purchased products`);
      return purchaseStatus;
    } catch (error) {
      logger.error('Error attempting to buy cart items', error.stack);
      throw error;
    }
  }
}
