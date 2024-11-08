import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import logger from 'src/loggerfile/logger';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getAllProducts(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async getProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async createProduct(createProductDto: CreateProductDto, imagePath: string | null): Promise<any> {
    logger.info('Create Product Service started')
    const { name, price, stock } = createProductDto;  
    try {
      if (stock < 0) {
        logger.error('Stock quantity must be a positive number so creation of product not happened')
        throw new Error('Stock quantity must be a positive number');
      }
      const newProduct = this.productRepository.create({
        name,
        price,
        stock,
        image: imagePath,
      });
  
      await this.productRepository.save(newProduct);
      logger.info('Product successfully Added and image added to uploads -> product images')
      return {
        Error: false,
        message: 'Product successfully added',
        // product: newProduct,
      };
    } catch (error) {
      logger.error(`${error.message || 'An error occurred while adding the product'}`)
      return {
        Error: true,
        message: error.message || 'An error occurred while adding the product',
      };
    }
  }
  
  async updateProduct(id: number,updateProductDto: CreateProductDto,imagePath: string | null): Promise<any> {
    logger.info(`Update Product Service started with product id - ${id}`);
    const { name, price, stock } = updateProductDto;
    try {
      const product = await this.productRepository.findOne({ where: { id } });

      if (!product) {
        logger.error('Product not found for update');
        throw new Error('Product not found');
      }

      product.name = name;
      product.price = price;
      product.stock = stock;
      product.image = imagePath;

      await this.productRepository.save(product);
      logger.info('Product successfully updated');

      return {
        Error: false,
        message: 'Product successfully updated',
      };
    } catch (error) {
      logger.error(`${error.message || 'An error occurred while updating the product'}`);
      return {
        Error: true,
        message: error.message || 'An error occurred while updating the product',
      };
    }
  }
  
  async bulkAddProducts(products: Product[]): Promise<any> {
    try {
      console.log("products",products)
      await this.productRepository.save(products);
      return {
        Error: false,
        message: `${products.length} products successfully added.`,
      };
    } catch (error) {
      return {
        Error: true,
        message: error.message || 'Error occurred while saving products.',
      };
    }
  }

  
}
