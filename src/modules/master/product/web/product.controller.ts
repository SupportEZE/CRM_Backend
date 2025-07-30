import { Body, Controller, Patch, Post, Req, Request, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ProductService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateProductDto, DuplicacyCheckDto, ProductDetailDto,
  ReadProductDto, UpdateProductDto, DeleteProductDto, ProductStatusDto,
  DeleteProductImageDto, ProductImportDto, ReadDropdownDto, ProductDocsDto,
  CreateProductPriceDto, ProductSaveDiscountDto,
  ProductReadDiscountDto, CreateProductDispatchDto, FetchProductDispatchDto
} from './dto/product.dto';

import { FilesInterceptor } from '@nestjs/platform-express';
import { FileUpload } from 'src/interceptors/fileupload.interceptor';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CustomerTypeService } from '../../customer-type/web/customer-type.service';
import { SharedProductService } from '../shared-product-service';
import { _IdDto, ProductIdDto } from 'src/common/dto/common.dto';

export enum productInternalRoutes {
  MRP_DROPDOWN = 'mrp-dropdown'
}
import { ProductUploadService } from '../product-upload.service';

@ApiTags('Product')
@ApiBearerAuth()
@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    @Inject(forwardRef(() => ProductUploadService))
    private readonly productUploadService: ProductUploadService,
    private readonly customerTypeService: CustomerTypeService,
    @Inject(forwardRef(() => SharedProductService))
    private readonly sharedProductService: SharedProductService,

  ) { }

  @Post('/create')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  async create(@Req() req: Request, @Body() params: CreateProductDto): Promise<CreateProductDto> {
    return await this.productService.create(req, params);
  }

  @Patch('/update')
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiBody({ type: UpdateProductDto })
  async update(@Req() req: Request, @Body() params: UpdateProductDto): Promise<UpdateProductDto> {
    return await this.productService.update(req, params);
  }

  @Patch('/update-status')
  @ApiOperation({ summary: 'Update product status' })
  @ApiBody({ type: ProductStatusDto })
  async updateStatus(@Req() req: Request, @Body() params: ProductStatusDto): Promise<ProductStatusDto> {
    return await this.productService.update(req, params);
  }

  @Patch('/delete')
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiBody({ type: DeleteProductDto })
  async delete(@Req() req: Request, @Body() params: DeleteProductDto): Promise<DeleteProductDto> {
    return await this.productService.update(req, params);
  }

  @Patch('/delete-file')
  @ApiOperation({ summary: 'Delete product image file' })
  @ApiBody({ type: DeleteProductImageDto })
  async deleteFile(@Req() req: Request, @Body() params: DeleteProductImageDto): Promise<DeleteProductImageDto> {
    return await this.productService.deleteFile(req, params);
  }

  @Post('/read')
  @ApiOperation({ summary: 'Read products list' })
  @ApiBody({ type: ReadProductDto })
  async read(@Req() req: Request, @Body() params: ReadProductDto): Promise<ReadProductDto> {
    return await this.productService.read(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Get product detail' })
  @ApiBody({ type: ProductDetailDto })
  async detail(@Req() req: Request, @Body() params: ProductDetailDto): Promise<ProductDetailDto> {
    return await this.productService.detail(req, params);
  }

  @Post('/duplicate')
  @ApiOperation({ summary: 'Check for duplicate product' })
  @ApiBody({ type: DuplicacyCheckDto })
  async duplicate(@Req() req: Request, @Body() params: DuplicacyCheckDto): Promise<DuplicacyCheckDto> {
    return await this.productService.duplicate(req, params);
  }

  @Post('/read-dropdown')
  @ApiOperation({ summary: 'Read dropdown data for products' })
  @ApiBody({ type: ReadDropdownDto })
  async readDropdown(@Req() req: Request, @Body() params: ReadDropdownDto): Promise<ReadDropdownDto> {
    return await this.productService.readDropdown(req, params);
  }

  @UseInterceptors(FileUpload)
  @Post('/import')
  @ApiOperation({ summary: 'Import product data' })
  @ApiBody({ type: ProductImportDto })
  async import(@Req() req: Request, @Body() params: ProductImportDto): Promise<ProductImportDto> {
    return await this.productService.import(req, params);
  }

  @ApiOperation({ summary: 'Upload multiple files to bucket' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.productService.upload(files, req);
  }

  @Post('/get-doc')
  @ApiOperation({ summary: 'Get uploaded documents by document ID' })
  @ApiBody({ type: ProductDocsDto })
  async getDocumentById(@Req() req: Request, @Body() params: ProductDocsDto): Promise<ProductDocsDto> {
    return await this.productService.getDocumentByDocsId(req, params);
  }

  @Post('/price-config')
  @ApiOperation({ summary: 'Get price configuration' })
  async priceConfig(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.sharedProductService.priceConfig(req, params);
  }

  @Post('/customer-type')
  @ApiOperation({ summary: 'Get customer types dropdown' })
  async customerType(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.customerTypeService.readDropdown(req, params);
  }

  @Post('/save-price')
  @ApiOperation({ summary: 'Save price for a product' })
  @ApiBody({ type: CreateProductPriceDto })
  async savePrice(@Req() req: Request, @Body() params: CreateProductPriceDto): Promise<CreateProductPriceDto> {
    return await this.sharedProductService.savePrice(req, params);
  }

  @Post('/product-discount')
  @ApiOperation({ summary: 'Read product discount information' })
  @ApiBody({ type: ProductReadDiscountDto })
  async productDiscount(@Req() req: Request, @Body() params: ProductReadDiscountDto): Promise<ProductReadDiscountDto> {
    return await this.sharedProductService.productDiscount(req, params);
  }

  @Post('/category-discount')
  @ApiOperation({ summary: 'Read category-wise discount' })
  @ApiBody({ type: ProductReadDiscountDto })
  async categoryDiscount(@Req() req: Request, @Body() params: ProductReadDiscountDto): Promise<ProductReadDiscountDto> {
    return await this.sharedProductService.categoryDiscount(req, params);
  }

  @Post('/save-discount')
  @ApiOperation({ summary: 'Save discount details' })
  @ApiBody({ type: ProductSaveDiscountDto })
  async saveDiscount(@Req() req: Request, @Body() params: ProductSaveDiscountDto): Promise<ProductSaveDiscountDto> {
    return await this.sharedProductService.saveDiscount(req, params);
  }

  @Post('/save-dispatch-config')
  @ApiOperation({ summary: 'Save dispatch details for a product' })
  @ApiBody({ type: CreateProductDispatchDto })
  async saveDispatchConfig(@Req() req: Request, @Body() params: CreateProductDispatchDto): Promise<CreateProductDispatchDto> {
    return await this.sharedProductService.saveDispatchConfig(req, params);
  }

  @Post('/mrp-dropdown')
  @ApiOperation({ summary: 'product mrp' })
  @ApiBody({ type: ProductIdDto })
  async mrpDropdown(@Req() req: Request, @Body() params: ProductIdDto): Promise<ProductIdDto> {
    return await this.sharedProductService.productPrice(req, params);
  }

  @Post('upload-category-point')
    @UseInterceptors(FileInterceptor('file'))
    async importProductCategoryData(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
      return await this.productUploadService.uploadPointCategoryData(req, file);
  }

  @Post('map-category-point')
  @UseInterceptors(FileInterceptor('file'))
  async mapProductCategoryData(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    return await this.productUploadService.mapPointCategoryData(req, file);
  }

  @ApiTags('upload product through sample csv')
  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importProductDataNew(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    return await this.productUploadService.uploadProductData(req, file);
  }

  @ApiTags('generate sample csv for product upload')
  @Post('generate-sample-csv')
  async generateProductUploadSampleCSV(@Req() req: Request) {
    return await this.productUploadService.generateProductUploadSampleCSV(req);
  }

}
