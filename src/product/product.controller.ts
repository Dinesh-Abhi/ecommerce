import { Controller, Get, Param, Logger, Post, Body, UseInterceptors, UploadedFile, Put } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import logger from 'src/loggerfile/logger';
import { CreateProductDto } from './dto/create-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as https from 'https';
import * as http from 'http';
import * as path from 'path';
import { promisify } from 'util';
import { createWriteStream } from 'fs';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Get('allproducts')
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Returns a list of products', type: [Product] })
  async getAllProducts(): Promise<Product[]> {
    logger.debug('Fetching all products'); 
    try {
      const products = await this.productService.getAllProducts();
      logger.info('Successfully fetched all products');
      return products;
    } catch (error) {
      logger.error('Error fetching products', error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Returns a product', type: Product })
  async getProductById(@Param('id') id: number): Promise<Product> {
    logger.debug(`Fetching product with ID: ${id}`);
    try {
      const product = await this.productService.getProductById(id);
      logger.info(`Successfully fetched product with ID: ${id}`);
      return product;
    } catch (error) {
      logger.error('Error fetching product', error.stack);
      throw error;
    }
  }

  // create-product-with-images
  @Post('create-product')
  @ApiOperation({ summary: 'Create a new product with image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateProductDto,
  })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: Product })
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/product-images',
      filename: (req, file, callback) => {
        callback(null, file.originalname);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))

  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (file && !allowedMimeTypes.includes(file.mimetype)) {
      return {
        Error: true,
        message: 'Only image files are allowed to upload.',
      };
    }
    const imagePath = file ? `/uploads/product-images/${file.originalname}` : null;
    const product = await this.productService.createProduct(createProductDto, imagePath);
    return product;
  }


  //update a product with image using the id
  @Put('update/:id')
  @ApiOperation({ summary: 'update a product with image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({type: CreateProductDto})
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/product-images',
      filename: (req, file, callback) => {
        callback(null, file.originalname);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async updateProduct(@Param('id') id: number, @Body() updateProductDto: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
    const imagePath = file ? `/uploads/product-images/${file.filename}` : null;
    return this.productService.updateProduct(id, updateProductDto, imagePath);
  }

  
  @Post('bulk-upload')
  @ApiOperation({ summary: 'Bulk upload products from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Bulk upload successful' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(@UploadedFile() file: Express.Multer.File): Promise<any> {
    if (!file || file.mimetype !== 'text/csv') {
      return {
        Error: true,
        message: 'Please upload a valid CSV file.',
      };
    }

    const csvFilePath = path.join(__dirname, '../../uploads', file.originalname);
    fs.writeFileSync(csvFilePath, file.buffer);

    try {
      // Call the service method to process the CSV
      const result = await this.productService.bulkAddProductsFromCSV(csvFilePath);
      return result;
    } catch (error) {
      return {
        Error: true,
        message: 'Error during bulk upload.',
        details: error.message,
      };
    } finally {
      // Optionally, delete the temporary CSV file after processing
      fs.unlinkSync(csvFilePath);
    }
  }
  
}
