import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import logger from 'src/loggerfile/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as csvParser from 'csv-parser';
import * as https from 'https';
import * as http from 'http';
import { createWriteStream } from 'fs';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) { }

  async getAllProducts(): Promise<any> {
    const products = await this.productRepository.find();
    if (!products || products.length === 0) {
      throw new Error('No products found');
    }
    const port = process.env.APP_PORT;
    const baseUrl = `http://localhost:${port}`;
    const updatedProducts = products.map(product => {
      const updatedProduct = { ...product };
      if (product.image) {
        updatedProduct.image = baseUrl + product.image;
      }

      return updatedProduct;
    });

    return {
      Error: false,
      message: 'Products successfully retrieved',
      payload: updatedProducts,
    };
  }



  async getProductById(id: number): Promise<any> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error('Product not found');
    }
    const port = process.env.APP_PORT;
    const baseUrl = `http://localhost:${port}`;
    const fullImageUrl = baseUrl + product.image;
    return {
      Error: false,
      message: 'Product successfully retrieved',
      payload: {
        ...product,
        image: fullImageUrl,
      },
    };
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

  async updateProduct(id: number, updateProductDto: CreateProductDto, imagePath: string | null): Promise<any> {
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

  async bulkAddProductsFromCSV(csvFilePath: string): Promise<any> {
    const products: any[] = [];
    const invalidRows: any[] = [];

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', async (row) => {

          try {
            const { name, price, stock, image } = row;

            const priceNum = parseFloat(price);
            const stockNum = parseInt(stock);

            if (!name || isNaN(priceNum) || isNaN(stockNum) || !image) {
              invalidRows.push({ row, reason: 'Missing required fields or invalid data' });
              logger.warn(`Invalid row: Missing required fields or invalid data ${JSON.stringify(row)}`);
              return;
            }

            if (priceNum <= 0 || stockNum < 0) {
              invalidRows.push({ row, reason: 'Invalid price or stock' });
              logger.warn(`Invalid row: Invalid price or stock ${JSON.stringify(row)}`);
              return;
            }

            stream.pause();

            const imagePath = await this.saveImageFromUrl(image);
            logger.info(`Image saved at: ${imagePath}`);

            const product = {
              name,
              price: priceNum,
              stock: stockNum,
              image: imagePath,
            };
            products.push(product);
            logger.info('Product added:', product);

            stream.resume();
          } catch (error) {
            invalidRows.push({ row, reason: 'Error processing row' });
            logger.error(`Error processing row: ${JSON.stringify(row)}, Error: ${error.message}`);
          }
        })
        .on('end', async () => {
          try {
            logger.info("Final products array before saving:", products);
            logger.info(`CSV parsing finished. Total products: ${products.length}, Invalid rows: ${invalidRows.length}`);

            if (products.length > 0) {
              const savedProducts = [];
              for (const product of products) {
                try {
                  const savedProduct = await this.productRepository.save(product);
                  savedProducts.push(savedProduct);
                  logger.info("Successfully saved product:", savedProduct);
                } catch (dbError) {
                  logger.error("Failed to save product:", product, dbError.message);
                }
              }

              if (savedProducts.length > 0) {
                resolve({
                  Error: false,
                  message: `${savedProducts.length} products added successfully.`,
                });
              } else {
                resolve({
                  Error: true,
                  message: 'No products were saved due to database errors.',
                });
              }
            } else if (invalidRows.length > 0) {
              resolve({
                Error: true,
                message: `Some rows are invalid. Please check the file. Invalid rows: ${invalidRows.length}`,
                invalidRows,
              });
            } else {
              resolve({
                Error: false,
                message: 'No valid products found in the CSV file.',
              });
            }
          } catch (error) {
            reject({
              Error: true,
              message: 'Error saving products to the database.',
              details: error.message,
            });
          }
        })
        .on('error', (error) => {
          reject({
            Error: true,
            message: 'Error reading CSV file.',
            details: error.message,
          });
        });
    });
  }


  private async saveImageFromUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileName = path.basename(imageUrl);
      const ext = path.extname(fileName);
      const filePath = path.join(__dirname, '../../uploads/product-images', fileName);

      logger.info(`Saving image from URL: ${imageUrl}`); // Log image URL

      const file = createWriteStream(filePath);
      const protocol = imageUrl.startsWith('https') ? https : http;

      protocol.get(imageUrl, (response) => {
        logger.info(`Download started for ${imageUrl}`); // Log when the download starts
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          logger.info(`Image saved at: ${filePath}`); // Log image save path
          resolve(`/uploads/product-images/${fileName}`); // Return the relative path for the image
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => { });
        logger.error(`Failed to download image: ${imageUrl}, Error: ${err.message}`);
        reject(`Failed to download image: ${err.message}`);
      });
    });
  }



}
