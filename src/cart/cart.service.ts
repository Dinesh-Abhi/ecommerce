import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from 'src/product/product.entity';
import { User } from 'src/users/users.entity';
import { CreateCartDto } from './dto/add-to-cart.dto';
import { Logger } from '@nestjs/common';
import logger from 'src/loggerfile/logger';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Add product to cart
  async addProductToCart(createCartDto: CreateCartDto, userId: number): Promise<Cart> {
    logger.debug(`Adding product ${createCartDto.productId} to user ${userId}'s cart with quantity ${createCartDto.quantity}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const product = await this.productRepository.findOne({ where: { id: createCartDto.productId } });
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if product already exists in cart
    let cartItem = await this.cartRepository.findOne({
      where: { user: user, product: product },
    });

    if (cartItem) {
      cartItem.quantity += createCartDto.quantity; // Update quantity if already in cart
      await this.cartRepository.save(cartItem);
      logger.info(`Updated quantity for product ${createCartDto.productId} in cart`);
      return cartItem;
    } else {
      cartItem = this.cartRepository.create({
        user,
        product,
        quantity: createCartDto.quantity,
      });
      await this.cartRepository.save(cartItem);
      logger.info(`Added product ${createCartDto.productId} to cart`);
      return cartItem;
    }
  }

  // Get all products in the user's cart
  async getCart(userId: number): Promise<Cart[]> {
    logger.debug(`Fetching cart for user ${userId}`);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const cartItems = await this.cartRepository.find({
      where: { user: user },
      relations: ['product'],
    });
    logger.info(`Fetched cart items for user ${userId}`);
    return cartItems;
  }

  // Attempt to buy the products in the cart (this can be extended to integrate with a payment system)
  async buyCart(userId: number): Promise<string> {
    logger.debug(`User ${userId} is attempting to buy products in the cart`);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const cartItems = await this.cartRepository.find({
      where: { user: user },
      relations: ['product'],
    });

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Implement any payment logic here if needed

    // Clear the cart after successful purchase (optional)
    await this.cartRepository.delete({ user: user });
    logger.info(`User ${userId} successfully bought products and cleared the cart`);
    return 'Purchase successful';
  }
}
